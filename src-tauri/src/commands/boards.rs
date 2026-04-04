use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Board {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
    pub background_type: Option<String>,
    pub background_value: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBoard {
    pub name: Option<String>,
    pub sort_order: Option<i64>,
    pub background_type: Option<String>,
    pub background_value: Option<String>,
}

#[tauri::command]
pub fn create_board(
    db: State<DbState>,
    project_id: String,
    name: String,
) -> Result<Board, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM boards WHERE project_id = ?1",
            params![project_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO boards (project_id, name, sort_order) VALUES (?1, ?2, ?3)",
        params![project_id, name, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM boards WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    get_board_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_boards(db: State<DbState>, project_id: String) -> Result<Vec<Board>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, sort_order, created_at, updated_at, background_type, background_value
             FROM boards WHERE project_id = ?1 ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(Board {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                background_type: row.get(6)?,
                background_value: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_boards(db: State<DbState>) -> Result<Vec<Board>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_id, name, sort_order, created_at, updated_at, background_type, background_value
             FROM boards ORDER BY project_id, sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Board {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                background_type: row.get(6)?,
                background_value: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_board(
    db: State<DbState>,
    id: String,
    updates: UpdateBoard,
) -> Result<Board, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(name) = &updates.name {
        conn.execute(
            "UPDATE boards SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(sort_order) = updates.sort_order {
        conn.execute(
            "UPDATE boards SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![sort_order, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if updates.background_type.is_some() || updates.background_value.is_some() {
        conn.execute(
            "UPDATE boards SET background_type = ?1, background_value = ?2, updated_at = datetime('now') WHERE id = ?3",
            params![updates.background_type, updates.background_value, id],
        )
        .map_err(|e| e.to_string())?;
    }

    get_board_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_board(db: State<DbState>, id: String) -> Result<Board, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    get_board_by_id(&conn, &id)
}

#[tauri::command]
pub fn delete_board(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM boards WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn get_board_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Board, String> {
    conn.query_row(
        "SELECT id, project_id, name, sort_order, created_at, updated_at, background_type, background_value FROM boards WHERE id = ?1",
        params![id],
        |row| {
            Ok(Board {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                background_type: row.get(6)?,
                background_value: row.get(7)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clone_board(
    db: State<DbState>,
    board_id: String,
    new_name: String,
    include_cards: bool,
) -> Result<Board, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

    // 1. Read source board
    let source = get_board_by_id(&tx, &board_id)?;

    // 2. Get max sort_order for new board position
    let max_sort: i64 = tx
        .query_row(
            "SELECT COALESCE(MAX(sort_order), 0) FROM boards WHERE project_id = ?1",
            params![source.project_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 3. Insert new board
    tx.execute(
        "INSERT INTO boards (project_id, name, sort_order, background_type, background_value) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![source.project_id, new_name, max_sort + 1, source.background_type, source.background_value],
    )
    .map_err(|e| e.to_string())?;

    let new_board_id: String = tx
        .query_row(
            "SELECT id FROM boards WHERE rowid = last_insert_rowid()",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 4. Read and clone columns
    let mut col_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();

    let columns: Vec<(String, String, i64, String)> = {
        let mut col_stmt = tx
            .prepare(
                "SELECT id, name, sort_order, status_category FROM columns WHERE board_id = ?1 ORDER BY sort_order",
            )
            .map_err(|e| e.to_string())?;
        let result = col_stmt
            .query_map(params![board_id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        result
    };

    for (old_col_id, name, sort_order, status_category) in &columns {
        tx.execute(
            "INSERT INTO columns (board_id, name, sort_order, status_category) VALUES (?1, ?2, ?3, ?4)",
            params![new_board_id, name, sort_order, status_category],
        )
        .map_err(|e| e.to_string())?;

        let new_col_id: String = tx
            .query_row(
                "SELECT id FROM columns WHERE rowid = last_insert_rowid()",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        col_map.insert(old_col_id.clone(), new_col_id);
    }

    // 5. If include_cards, clone cards + card_tags + subtasks + FTS
    if include_cards {
        for (old_col_id, new_col_id) in &col_map {
            let cards: Vec<(String, String, String, Option<String>, Option<String>, Option<String>, i64, i64)> = {
                let mut card_stmt = tx
                    .prepare(
                        "SELECT id, title, description, start_date, due_date, color, completed, sort_order FROM cards WHERE column_id = ?1 ORDER BY sort_order",
                    )
                    .map_err(|e| e.to_string())?;
                let result = card_stmt
                    .query_map(params![old_col_id], |row| {
                        Ok((
                            row.get(0)?,
                            row.get(1)?,
                            row.get(2)?,
                            row.get(3)?,
                            row.get(4)?,
                            row.get(5)?,
                            row.get(6)?,
                            row.get(7)?,
                        ))
                    })
                    .map_err(|e| e.to_string())?
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| e.to_string())?;
                result
            };

            for (old_card_id, title, description, start_date, due_date, color, completed, sort_order) in &cards {
                tx.execute(
                    "INSERT INTO cards (column_id, title, description, start_date, due_date, color, completed, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    params![new_col_id, title, description, start_date, due_date, color, completed, sort_order],
                )
                .map_err(|e| e.to_string())?;

                let new_card_id: String = tx
                    .query_row(
                        "SELECT id FROM cards WHERE rowid = last_insert_rowid()",
                        [],
                        |row| row.get(0),
                    )
                    .map_err(|e| e.to_string())?;

                // Clone card_tags
                tx.execute(
                    "INSERT INTO card_tags (card_id, tag_id) SELECT ?1, tag_id FROM card_tags WHERE card_id = ?2",
                    params![new_card_id, old_card_id],
                )
                .map_err(|e| e.to_string())?;

                // Clone subtasks
                tx.execute(
                    "INSERT INTO subtasks (card_id, title, completed, sort_order) SELECT ?1, title, completed, sort_order FROM subtasks WHERE card_id = ?2",
                    params![new_card_id, old_card_id],
                )
                .map_err(|e| e.to_string())?;

                // Sync FTS for the new card
                super::cards::sync_fts(&tx, &new_card_id, title, description);
            }
        }
    }

    let new_board = get_board_by_id(&tx, &new_board_id)?;
    tx.commit().map_err(|e| e.to_string())?;

    Ok(new_board)
}

#[tauri::command]
pub fn move_board(
    db: State<DbState>,
    board_id: String,
    target_project_id: String,
) -> Result<Board, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Check current project
    let current_project_id: String = conn
        .query_row(
            "SELECT project_id FROM boards WHERE id = ?1",
            params![board_id],
            |r| r.get(0),
        )
        .map_err(|_| "Board not found".to_string())?;

    if current_project_id == target_project_id {
        return get_board_by_id(&conn, &board_id);
    }

    // Validate target project exists
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM projects WHERE id = ?1",
            params![target_project_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    if !exists {
        return Err("Target project not found".to_string());
    }

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

    let new_sort_order: i64 = tx
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM boards WHERE project_id = ?1",
            params![target_project_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE boards SET project_id = ?1, sort_order = ?2, updated_at = datetime('now') WHERE id = ?3",
        params![target_project_id, new_sort_order, board_id],
    )
    .map_err(|e| e.to_string())?;

    let board = get_board_by_id(&tx, &board_id)?;
    tx.commit().map_err(|e| e.to_string())?;

    Ok(board)
}

#[tauri::command]
pub fn save_board_background_image(
    handle: tauri::AppHandle,
    board_id: String,
    source_path: String,
) -> Result<String, String> {
    use std::path::PathBuf;

    let source = PathBuf::from(&source_path);

    // Validate file extension
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    if !["png", "jpg", "jpeg", "webp"].contains(&ext.as_str()) {
        return Err("Unsupported file type".to_string());
    }

    // Resolve to canonical path and confirm it is a file
    let canonical = source.canonicalize().map_err(|_| "Invalid source path".to_string())?;
    if !canonical.is_file() {
        return Err("Source is not a file".to_string());
    }

    let app_data = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let bg_dir = app_data.join("backgrounds");
    std::fs::create_dir_all(&bg_dir).map_err(|e| e.to_string())?;

    let filename = canonical
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "bg.png".to_string());

    let dest = bg_dir.join(format!("{}_{}", board_id, filename));
    std::fs::copy(&canonical, &dest).map_err(|e| e.to_string())?;

    Ok(dest.to_string_lossy().to_string())
}
