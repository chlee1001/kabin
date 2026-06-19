use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::commands::deserialize_optional_nullable;
use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CardTemplate {
    pub id: String,
    pub board_id: String,
    pub name: String,
    pub title: String,
    pub description: String,
    pub color: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTemplate {
    pub name: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    #[serde(default, deserialize_with = "deserialize_optional_nullable")]
    pub color: Option<Option<String>>,
}

#[tauri::command]
pub fn create_template(
    db: State<DbState>,
    board_id: String,
    name: String,
) -> Result<CardTemplate, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM card_templates WHERE board_id = ?1",
            params![board_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO card_templates (board_id, name, sort_order) VALUES (?1, ?2, ?3)",
        params![board_id, name, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM card_templates WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    get_template_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_templates(db: State<DbState>, board_id: String) -> Result<Vec<CardTemplate>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, board_id, name, title, description, color, sort_order, created_at, updated_at
             FROM card_templates WHERE board_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![board_id], |row| {
            Ok(CardTemplate {
                id: row.get(0)?,
                board_id: row.get(1)?,
                name: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                color: row.get(5)?,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_template(
    db: State<DbState>,
    id: String,
    updates: UpdateTemplate,
) -> Result<CardTemplate, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(name) = &updates.name {
        conn.execute(
            "UPDATE card_templates SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(title) = &updates.title {
        conn.execute(
            "UPDATE card_templates SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![title, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(description) = &updates.description {
        conn.execute(
            "UPDATE card_templates SET description = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![description, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(color) = &updates.color {
        conn.execute(
            "UPDATE card_templates SET color = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![color, id],
        )
        .map_err(|e| e.to_string())?;
    }

    get_template_by_id(&conn, &id)
}

#[tauri::command]
pub fn delete_template(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM card_templates WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn create_card_from_template(
    db: State<DbState>,
    template_id: String,
    column_id: String,
) -> Result<super::cards::Card, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let tmpl = get_template_by_id(&conn, &template_id)?;

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM cards WHERE column_id = ?1",
            params![column_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO cards (column_id, title, description, color, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![column_id, tmpl.title, tmpl.description, tmpl.color, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let new_id: String = conn
        .query_row("SELECT id FROM cards WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let card = conn.query_row(
        "SELECT id, column_id, title, description, start_date, due_date, color, sort_order, completed, created_at, updated_at FROM cards WHERE id = ?1",
        params![new_id],
        |row| super::cards::row_to_card(row),
    ).map_err(|e| e.to_string())?;

    super::cards::sync_fts(&conn, &new_id, &card.title, &card.description);
    Ok(card)
}

fn get_template_by_id(conn: &rusqlite::Connection, id: &str) -> Result<CardTemplate, String> {
    conn.query_row(
        "SELECT id, board_id, name, title, description, color, sort_order, created_at, updated_at FROM card_templates WHERE id = ?1",
        params![id],
        |row| {
            Ok(CardTemplate {
                id: row.get(0)?,
                board_id: row.get(1)?,
                name: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                color: row.get(5)?,
                sort_order: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::UpdateTemplate;

    // Same null-clear regression as cards: template color must be clearable.
    #[test]
    fn color_present_as_null_becomes_some_none() {
        let u: UpdateTemplate = serde_json::from_str(r#"{"color": null}"#).unwrap();
        assert_eq!(u.color, Some(None), "null color must clear (Some(None))");
    }

    #[test]
    fn color_present_with_value_becomes_some_some() {
        let u: UpdateTemplate = serde_json::from_str(r##"{"color": "#fff"}"##).unwrap();
        assert_eq!(u.color, Some(Some("#fff".to_string())));
    }

    #[test]
    fn color_absent_stays_none() {
        let u: UpdateTemplate = serde_json::from_str(r#"{"name": "Tmpl"}"#).unwrap();
        assert_eq!(u.name, Some("Tmpl".to_string()));
        assert_eq!(u.color, None, "absent color must stay None");
    }
}
