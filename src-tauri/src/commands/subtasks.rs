use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subtask {
    pub id: String,
    pub card_id: String,
    pub title: String,
    pub completed: bool,
    pub sort_order: i64,
    pub created_at: String,
}

#[tauri::command]
pub fn create_subtask(
    db: State<DbState>,
    card_id: String,
    title: String,
) -> Result<Subtask, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM subtasks WHERE card_id = ?1",
            params![card_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO subtasks (card_id, title, sort_order) VALUES (?1, ?2, ?3)",
        params![card_id, title, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM subtasks WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    get_subtask_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_subtasks(db: State<DbState>, card_id: String) -> Result<Vec<Subtask>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, card_id, title, completed, sort_order, created_at
             FROM subtasks WHERE card_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![card_id], |row| {
            Ok(Subtask {
                id: row.get(0)?,
                card_id: row.get(1)?,
                title: row.get(2)?,
                completed: row.get::<_, i64>(3)? != 0,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_subtask(
    db: State<DbState>,
    id: String,
    title: Option<String>,
    completed: Option<bool>,
) -> Result<Subtask, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(title) = &title {
        conn.execute("UPDATE subtasks SET title = ?1 WHERE id = ?2", params![title, id])
            .map_err(|e| e.to_string())?;
    }
    if let Some(completed) = completed {
        conn.execute(
            "UPDATE subtasks SET completed = ?1 WHERE id = ?2",
            params![completed as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }

    get_subtask_by_id(&conn, &id)
}

#[tauri::command]
pub fn delete_subtask(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM subtasks WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reorder_subtasks(
    db: State<DbState>,
    card_id: String,
    subtask_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for (i, sid) in subtask_ids.iter().enumerate() {
        tx.execute(
            "UPDATE subtasks SET sort_order = ?1 WHERE id = ?2 AND card_id = ?3",
            params![i as i64, sid, card_id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

fn get_subtask_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Subtask, String> {
    conn.query_row(
        "SELECT id, card_id, title, completed, sort_order, created_at FROM subtasks WHERE id = ?1",
        params![id],
        |row| {
            Ok(Subtask {
                id: row.get(0)?,
                card_id: row.get(1)?,
                title: row.get(2)?,
                completed: row.get::<_, i64>(3)? != 0,
                sort_order: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
