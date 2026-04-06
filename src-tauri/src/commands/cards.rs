use rusqlite::params;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Card {
    pub id: String,
    pub column_id: String,
    pub title: String,
    pub description: String,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub color: Option<String>,
    pub sort_order: i64,
    pub completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CardWithTags {
    #[serde(flatten)]
    pub card: Card,
    pub tags: Vec<super::tags::Tag>,
    pub subtask_total: i64,
    pub subtask_done: i64,
}

#[derive(Debug, Deserialize)]
pub struct CardUpdate {
    pub title: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<Option<String>>,
    pub due_date: Option<Option<String>>,
    pub color: Option<Option<String>>,
    pub completed: Option<bool>,
}

pub fn extract_plain_text(tiptap_json: &str) -> String {
    fn walk(node: &Value, buf: &mut String) {
        if let Some(text) = node.get("text").and_then(|t| t.as_str()) {
            buf.push_str(text);
        }
        if let Some(content) = node.get("content").and_then(|c| c.as_array()) {
            for child in content {
                walk(child, buf);
            }
            buf.push('\n');
        }
    }

    let mut buf = String::new();
    if let Ok(doc) = serde_json::from_str::<Value>(tiptap_json) {
        walk(&doc, &mut buf);
    }
    buf.trim().to_string()
}

pub fn sync_fts(conn: &rusqlite::Connection, card_id: &str, title: &str, description: &str) {
    let plain = extract_plain_text(description);
    let rowid: Result<i64, _> = conn.query_row(
        "SELECT rowid FROM cards WHERE id = ?1",
        params![card_id],
        |r| r.get(0),
    );
    if let Ok(rowid) = rowid {
        let _ = conn.execute(
            "INSERT OR REPLACE INTO cards_fts(rowid, title, description_text) VALUES (?1, ?2, ?3)",
            params![rowid, title, plain],
        );
    }
}

fn delete_fts(conn: &rusqlite::Connection, card_id: &str) {
    let rowid: Result<i64, _> = conn.query_row(
        "SELECT rowid FROM cards WHERE id = ?1",
        params![card_id],
        |r| r.get(0),
    );
    if let Ok(rowid) = rowid {
        let _ = conn.execute(
            "INSERT INTO cards_fts(cards_fts, rowid, title, description_text) VALUES('delete', ?1, '', '')",
            params![rowid],
        );
    }
}

#[tauri::command]
pub fn create_card(
    db: State<DbState>,
    column_id: String,
    title: String,
    description: Option<String>,
) -> Result<Card, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let description = description.unwrap_or_else(|| "{}".to_string());

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM cards WHERE column_id = ?1",
            params![column_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO cards (column_id, title, description, sort_order) VALUES (?1, ?2, ?3, ?4)",
        params![column_id, title, description, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM cards WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    sync_fts(&conn, &id, &title, &description);
    get_card_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_cards(db: State<DbState>, column_id: String) -> Result<Vec<Card>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, column_id, title, description, start_date, due_date, color, sort_order, completed, created_at, updated_at
             FROM cards WHERE column_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![column_id], |row| row_to_card(row))
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_cards_enriched(db: State<DbState>, column_id: String) -> Result<Vec<CardWithTags>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, column_id, title, description, start_date, due_date, color, sort_order, completed, created_at, updated_at
             FROM cards WHERE column_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let cards: Vec<Card> = stmt
        .query_map(params![column_id], |row| row_to_card(row))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut result = Vec::with_capacity(cards.len());
    for card in cards {
        let tags: Vec<super::tags::Tag> = conn
            .prepare("SELECT t.id, t.name, t.color FROM tags t JOIN card_tags ct ON ct.tag_id = t.id WHERE ct.card_id = ?1 ORDER BY t.name")
            .map_err(|e| e.to_string())?
            .query_map(params![card.id], |row| {
                Ok(super::tags::Tag { id: row.get(0)?, name: row.get(1)?, color: row.get(2)? })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        let (subtask_total, subtask_done): (i64, i64) = conn
            .query_row(
                "SELECT COUNT(*), SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) FROM subtasks WHERE card_id = ?1",
                params![card.id],
                |row| Ok((row.get(0)?, row.get::<_, Option<i64>>(1)?.unwrap_or(0))),
            )
            .map_err(|e| e.to_string())?;

        result.push(CardWithTags { card, tags, subtask_total, subtask_done });
    }

    Ok(result)
}

#[tauri::command]
pub fn get_card(db: State<DbState>, id: String) -> Result<Card, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_card_by_id(&conn, &id)
}

#[derive(Debug, Serialize)]
pub struct CardLocation {
    pub column_name: String,
    pub status_category: String,
    pub board_id: String,
    pub board_name: String,
    pub project_id: String,
    pub project_name: String,
    pub project_color: String,
}

#[tauri::command]
pub fn get_card_location(db: State<DbState>, id: String) -> Result<CardLocation, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT co.name, co.status_category, b.id, b.name, p.id, p.name, p.color
         FROM cards ca
         JOIN columns co ON co.id = ca.column_id
         JOIN boards b ON b.id = co.board_id
         JOIN projects p ON p.id = b.project_id
         WHERE ca.id = ?1",
        params![id],
        |row| {
            Ok(CardLocation {
                column_name: row.get(0)?,
                status_category: row.get(1)?,
                board_id: row.get(2)?,
                board_name: row.get(3)?,
                project_id: row.get(4)?,
                project_name: row.get(5)?,
                project_color: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_card(
    db: State<DbState>,
    id: String,
    updates: CardUpdate,
) -> Result<Card, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(title) = &updates.title {
        conn.execute(
            "UPDATE cards SET title = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![title, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(description) = &updates.description {
        conn.execute(
            "UPDATE cards SET description = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![description, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(start_date) = &updates.start_date {
        conn.execute(
            "UPDATE cards SET start_date = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![start_date, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(due_date) = &updates.due_date {
        conn.execute(
            "UPDATE cards SET due_date = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![due_date, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(color) = &updates.color {
        conn.execute(
            "UPDATE cards SET color = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![color, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(completed) = updates.completed {
        conn.execute(
            "UPDATE cards SET completed = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![completed as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }

    let card = get_card_by_id(&conn, &id)?;
    sync_fts(&conn, &id, &card.title, &card.description);
    Ok(card)
}

#[tauri::command]
pub fn delete_card(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    delete_fts(&conn, &id);
    conn.execute("DELETE FROM cards WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clone_card(db: State<DbState>, card_id: String) -> Result<Card, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let source = get_card_by_id(&conn, &card_id)?;

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM cards WHERE column_id = ?1",
            params![source.column_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO cards (column_id, title, description, start_date, due_date, color, completed, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)",
        params![source.column_id, format!("{} (copy)", source.title), source.description, source.start_date, source.due_date, source.color, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let new_id: String = conn
        .query_row("SELECT id FROM cards WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    // Clone tags
    conn.execute(
        "INSERT INTO card_tags (card_id, tag_id) SELECT ?1, tag_id FROM card_tags WHERE card_id = ?2",
        params![new_id, card_id],
    )
    .map_err(|e| e.to_string())?;

    // Clone subtasks
    conn.execute(
        "INSERT INTO subtasks (card_id, title, completed, sort_order) SELECT ?1, title, 0, sort_order FROM subtasks WHERE card_id = ?2",
        params![new_id, card_id],
    )
    .map_err(|e| e.to_string())?;

    let new_card = get_card_by_id(&conn, &new_id)?;
    sync_fts(&conn, &new_id, &new_card.title, &new_card.description);
    Ok(new_card)
}

#[tauri::command]
pub fn move_card(
    db: State<DbState>,
    card_id: String,
    target_column_id: String,
    position: i64,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

    // Move card to new column
    tx.execute(
        "UPDATE cards SET column_id = ?1, sort_order = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![target_column_id, position, card_id],
    )
    .map_err(|e| e.to_string())?;

    // Reorder remaining cards in target column
    let other_ids: Vec<String> = {
        let mut stmt = tx
            .prepare(
                "SELECT id FROM cards WHERE column_id = ?1 AND id != ?2 ORDER BY sort_order ASC",
            )
            .map_err(|e| e.to_string())?;
        let ids = stmt
            .query_map(params![target_column_id, card_id], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        ids
    };

    let mut order = 0i64;
    for oid in &other_ids {
        if order == position {
            order += 1;
        }
        tx.execute(
            "UPDATE cards SET sort_order = ?1 WHERE id = ?2",
            params![order, oid],
        )
        .map_err(|e| e.to_string())?;
        order += 1;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_cards(
    db: State<DbState>,
    column_id: String,
    card_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for (i, card_id) in card_ids.iter().enumerate() {
        tx.execute(
            "UPDATE cards SET sort_order = ?1, column_id = ?2, updated_at = datetime('now') WHERE id = ?3",
            params![i as i64, column_id, card_id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

pub fn row_to_card(row: &rusqlite::Row) -> rusqlite::Result<Card> {
    Ok(Card {
        id: row.get(0)?,
        column_id: row.get(1)?,
        title: row.get(2)?,
        description: row.get(3)?,
        start_date: row.get(4)?,
        due_date: row.get(5)?,
        color: row.get(6)?,
        sort_order: row.get(7)?,
        completed: row.get::<_, i64>(8)? != 0,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

fn get_card_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Card, String> {
    conn.query_row(
        "SELECT id, column_id, title, description, start_date, due_date, color, sort_order, completed, created_at, updated_at
         FROM cards WHERE id = ?1",
        params![id],
        |row| row_to_card(row),
    )
    .map_err(|e| e.to_string())
}
