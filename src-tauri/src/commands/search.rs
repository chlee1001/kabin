use rusqlite::params;
use serde::Serialize;
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub card_id: String,
    pub title: String,
    pub snippet: String,
    pub project_name: String,
    pub project_color: String,
    pub board_name: String,
    pub column_name: String,
}

#[tauri::command]
pub fn global_search(
    db: State<DbState>,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<SearchResult>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(20);

    if query.trim().is_empty() {
        return Ok(vec![]);
    }

    // Sanitize tokens: strip FTS5 special characters, skip empty results
    let tokens: Vec<String> = query
        .split_whitespace()
        .map(|w| {
            w.chars()
                .filter(|c| c.is_alphanumeric() || *c == '_')
                .collect::<String>()
        })
        .filter(|w| !w.is_empty())
        .collect();

    if tokens.is_empty() {
        return Ok(vec![]);
    }

    let fts_query = tokens
        .iter()
        .map(|w| format!("\"{}\"*", w))
        .collect::<Vec<_>>()
        .join(" ");

    // Try FTS first, fall back to LIKE on parse error
    let fts_result: Result<Vec<SearchResult>, _> = (|| {
        let mut stmt = conn.prepare(
            "SELECT
                ca.id, ca.title,
                snippet(cards_fts, 1, '<mark>', '</mark>', '...', 32),
                p.name, p.color, b.name, co.name
             FROM cards_fts fts
             JOIN cards ca ON ca.rowid = fts.rowid
             JOIN columns co ON co.id = ca.column_id
             JOIN boards b ON b.id = co.board_id
             JOIN projects p ON p.id = b.project_id
             WHERE cards_fts MATCH ?1
             ORDER BY rank
             LIMIT ?2",
        )?;

        let rows = stmt.query_map(params![fts_query, limit], |row| {
            Ok(SearchResult {
                card_id: row.get(0)?,
                title: row.get(1)?,
                snippet: row.get(2)?,
                project_name: row.get(3)?,
                project_color: row.get(4)?,
                board_name: row.get(5)?,
                column_name: row.get(6)?,
            })
        })?;

        rows.collect::<Result<Vec<_>, _>>()
    })();

    match fts_result {
        Ok(results) => Ok(results),
        Err(_) => {
            // Fallback: LIKE-based search using sanitized tokens
            let pattern = format!("%{}%", tokens.join(" "));
            let mut stmt = conn
                .prepare(
                    "SELECT
                        ca.id, ca.title, ca.title,
                        p.name, p.color, b.name, co.name
                     FROM cards ca
                     JOIN columns co ON co.id = ca.column_id
                     JOIN boards b ON b.id = co.board_id
                     JOIN projects p ON p.id = b.project_id
                     WHERE ca.title LIKE ?1 OR ca.description LIKE ?1
                     LIMIT ?2",
                )
                .map_err(|e| e.to_string())?;

            let rows = stmt
                .query_map(params![pattern, limit], |row| {
                    Ok(SearchResult {
                        card_id: row.get(0)?,
                        title: row.get(1)?,
                        snippet: row.get(2)?,
                        project_name: row.get(3)?,
                        project_color: row.get(4)?,
                        board_name: row.get(5)?,
                        column_name: row.get(6)?,
                    })
                })
                .map_err(|e| e.to_string())?;

            rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
        }
    }
}
