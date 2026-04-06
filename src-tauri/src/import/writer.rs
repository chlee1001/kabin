use super::ImportData;
use crate::commands::cards::sync_fts;
use rusqlite::{params, Connection};
use std::collections::HashMap;

pub fn write_import(conn: &Connection, data: ImportData) -> Result<String, String> {
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;

    // 1. Create project
    tx.execute(
        "INSERT INTO projects (name) VALUES (?1)",
        params![data.project_name],
    )
    .map_err(|e| e.to_string())?;

    let project_id: String = tx
        .query_row(
            "SELECT id FROM projects WHERE rowid = last_insert_rowid()",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // 2. Ensure tags exist and build name -> id map
    let mut tag_id_map: HashMap<String, String> = HashMap::new();
    for tag in &data.tags {
        tx.execute(
            "INSERT OR IGNORE INTO tags (name, color) VALUES (?1, ?2)",
            params![tag.name, tag.color],
        )
        .map_err(|e| e.to_string())?;

        let tag_id: String = tx
            .query_row(
                "SELECT id FROM tags WHERE name = ?1",
                params![tag.name],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        tag_id_map.insert(tag.name.clone(), tag_id);
    }

    // 3. Insert boards, columns, cards, subtasks
    for (board_idx, board) in data.boards.iter().enumerate() {
        tx.execute(
            "INSERT INTO boards (project_id, name, sort_order) VALUES (?1, ?2, ?3)",
            params![project_id, board.name, board_idx as i64],
        )
        .map_err(|e| e.to_string())?;

        let board_id: String = tx
            .query_row(
                "SELECT id FROM boards WHERE rowid = last_insert_rowid()",
                [],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;

        let col_count = board.columns.len();
        for (col_idx, col) in board.columns.iter().enumerate() {
            let status_category = if col_count <= 1 {
                "other"
            } else if col_idx == 0 {
                "todo"
            } else if col_idx == col_count - 1 {
                "done"
            } else {
                "in_progress"
            };

            tx.execute(
                "INSERT INTO columns (board_id, name, sort_order, status_category) VALUES (?1, ?2, ?3, ?4)",
                params![board_id, col.name, col_idx as i64, status_category],
            )
            .map_err(|e| e.to_string())?;

            let column_id: String = tx
                .query_row(
                    "SELECT id FROM columns WHERE rowid = last_insert_rowid()",
                    [],
                    |row| row.get(0),
                )
                .map_err(|e| e.to_string())?;

            let is_done_column = status_category == "done";

            for (card_idx, card) in col.cards.iter().enumerate() {
                let completed = card.completed || is_done_column;

                tx.execute(
                    "INSERT INTO cards (column_id, title, description, due_date, start_date, color, completed, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    params![
                        column_id,
                        card.title,
                        card.description,
                        card.due_date,
                        card.start_date,
                        card.color,
                        completed as i64,
                        card_idx as i64
                    ],
                )
                .map_err(|e| e.to_string())?;

                let card_id: String = tx
                    .query_row(
                        "SELECT id FROM cards WHERE rowid = last_insert_rowid()",
                        [],
                        |row| row.get(0),
                    )
                    .map_err(|e| e.to_string())?;

                // Sync FTS
                sync_fts(&tx, &card_id, &card.title, &card.description);

                // Card tags
                for tag_name in &card.tags {
                    if let Some(tag_id) = tag_id_map.get(tag_name) {
                        let _ = tx.execute(
                            "INSERT OR IGNORE INTO card_tags (card_id, tag_id) VALUES (?1, ?2)",
                            params![card_id, tag_id],
                        );
                    }
                }

                // Subtasks
                for (st_idx, subtask) in card.subtasks.iter().enumerate() {
                    tx.execute(
                        "INSERT INTO subtasks (card_id, title, completed, sort_order) VALUES (?1, ?2, ?3, ?4)",
                        params![
                            card_id,
                            subtask.title,
                            subtask.completed as i64,
                            st_idx as i64
                        ],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(project_id)
}
