use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Column {
    pub id: String,
    pub board_id: String,
    pub name: String,
    pub sort_order: i64,
    pub status_category: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateColumn {
    pub name: Option<String>,
    pub status_category: Option<String>,
    pub sort_order: Option<i64>,
}

#[tauri::command]
pub fn create_column(
    db: State<DbState>,
    board_id: String,
    name: String,
    status_category: Option<String>,
) -> Result<Column, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let status_category = status_category.unwrap_or_else(|| "other".to_string());

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM columns WHERE board_id = ?1",
            params![board_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO columns (board_id, name, sort_order, status_category) VALUES (?1, ?2, ?3, ?4)",
        params![board_id, name, max_order + 1, status_category],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM columns WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    get_column_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_columns(db: State<DbState>, board_id: String) -> Result<Vec<Column>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, board_id, name, sort_order, status_category, created_at, updated_at
             FROM columns WHERE board_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![board_id], |row| {
            Ok(Column {
                id: row.get(0)?,
                board_id: row.get(1)?,
                name: row.get(2)?,
                sort_order: row.get(3)?,
                status_category: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_column(
    db: State<DbState>,
    id: String,
    updates: UpdateColumn,
) -> Result<Column, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(name) = &updates.name {
        conn.execute(
            "UPDATE columns SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(status_category) = &updates.status_category {
        conn.execute(
            "UPDATE columns SET status_category = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![status_category, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(sort_order) = updates.sort_order {
        conn.execute(
            "UPDATE columns SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![sort_order, id],
        )
        .map_err(|e| e.to_string())?;
    }

    get_column_by_id(&conn, &id)
}

#[tauri::command]
pub fn delete_column(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM columns WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_columns(
    db: State<DbState>,
    board_id: String,
    column_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for (i, col_id) in column_ids.iter().enumerate() {
        tx.execute(
            "UPDATE columns SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2 AND board_id = ?3",
            params![i as i64, col_id, board_id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

fn get_column_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Column, String> {
    conn.query_row(
        "SELECT id, board_id, name, sort_order, status_category, created_at, updated_at FROM columns WHERE id = ?1",
        params![id],
        |row| {
            Ok(Column {
                id: row.get(0)?,
                board_id: row.get(1)?,
                name: row.get(2)?,
                sort_order: row.get(3)?,
                status_category: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
