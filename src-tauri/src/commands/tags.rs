use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[tauri::command]
pub fn create_tag(
    db: State<DbState>,
    name: String,
    color: Option<String>,
) -> Result<Tag, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let color = color.unwrap_or_else(|| "#94a3b8".to_string());

    conn.execute(
        "INSERT INTO tags (name, color) VALUES (?1, ?2)",
        params![name, color],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM tags WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    Ok(Tag { id, name, color })
}

#[tauri::command]
pub fn get_tags(db: State<DbState>) -> Result<Vec<Tag>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, color FROM tags ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_tag(
    db: State<DbState>,
    id: String,
    name: Option<String>,
    color: Option<String>,
) -> Result<Tag, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(name) = &name {
        conn.execute("UPDATE tags SET name = ?1 WHERE id = ?2", params![name, id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(color) = &color {
        conn.execute("UPDATE tags SET color = ?1 WHERE id = ?2", params![color, id])
            .map_err(|e| e.to_string())?;
    }

    conn.query_row(
        "SELECT id, name, color FROM tags WHERE id = ?1",
        params![id],
        |row| Ok(Tag { id: row.get(0)?, name: row.get(1)?, color: row.get(2)? }),
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_tag(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn add_card_tag(
    db: State<DbState>,
    card_id: String,
    tag_id: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO card_tags (card_id, tag_id) VALUES (?1, ?2)",
        params![card_id, tag_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn remove_card_tag(
    db: State<DbState>,
    card_id: String,
    tag_id: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM card_tags WHERE card_id = ?1 AND tag_id = ?2",
        params![card_id, tag_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_card_tags(db: State<DbState>, card_id: String) -> Result<Vec<Tag>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.name, t.color FROM tags t
             INNER JOIN card_tags ct ON ct.tag_id = t.id
             WHERE ct.card_id = ?1 ORDER BY t.name ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![card_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
