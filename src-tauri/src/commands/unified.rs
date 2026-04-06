use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize)]
pub struct UnifiedCardTag {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Serialize)]
pub struct UnifiedCard {
    pub card_id: String,
    pub title: String,
    pub due_date: Option<String>,
    pub start_date: Option<String>,
    pub color: Option<String>,
    pub sort_order: i64,
    pub completed: bool,
    pub column_id: String,
    pub column_name: String,
    pub status_category: String,
    pub board_id: String,
    pub board_name: String,
    pub project_id: String,
    pub project_name: String,
    pub project_color: String,
    pub subtask_total: i64,
    pub subtask_done: i64,
    pub tags: Vec<UnifiedCardTag>,
}

#[derive(Debug, Deserialize)]
pub struct CardFilter {
    pub project_ids: Option<Vec<String>>,
    pub board_ids: Option<Vec<String>>,
    pub status_categories: Option<Vec<String>>,
    pub tag_ids: Option<Vec<String>>,
    pub due_date_from: Option<String>,
    pub due_date_to: Option<String>,
    pub search: Option<String>,
}

#[tauri::command]
pub fn get_cards_by_status_category(db: State<DbState>) -> Result<Vec<UnifiedCard>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    query_unified_cards(&conn, &CardFilter {
        project_ids: None,
        board_ids: None,
        status_categories: None,
        tag_ids: None,
        due_date_from: None,
        due_date_to: None,
        search: None,
    })
}

#[tauri::command]
pub fn get_all_cards_with_filters(
    db: State<DbState>,
    filters: CardFilter,
) -> Result<Vec<UnifiedCard>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    query_unified_cards(&conn, &filters)
}

#[tauri::command]
pub fn move_card_by_status_category(
    db: State<DbState>,
    card_id: String,
    target_status: String,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Find the card's board
    let board_id: String = conn
        .query_row(
            "SELECT co.board_id FROM cards ca
             JOIN columns co ON co.id = ca.column_id
             WHERE ca.id = ?1",
            params![card_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    // Find target column with that status_category on the same board
    let target_column_id: Result<String, _> = conn.query_row(
        "SELECT co.id FROM columns co
         WHERE co.board_id = ?1 AND co.status_category = ?2
         ORDER BY co.sort_order ASC LIMIT 1",
        params![board_id, target_status],
        |row| row.get(0),
    );

    match target_column_id {
        Ok(col_id) => {
            let max_order: i64 = conn
                .query_row(
                    "SELECT COALESCE(MAX(sort_order), -1) FROM cards WHERE column_id = ?1",
                    params![col_id],
                    |r| r.get(0),
                )
                .map_err(|e| e.to_string())?;

            conn.execute(
                "UPDATE cards SET column_id = ?1, sort_order = ?2, updated_at = datetime('now') WHERE id = ?3",
                params![col_id, max_order + 1, card_id],
            )
            .map_err(|e| e.to_string())?;

            Ok(col_id)
        }
        Err(_) => Err("해당 상태 컬럼이 없습니다".to_string()),
    }
}

#[tauri::command]
pub fn reorder_unified_cards(
    db: State<DbState>,
    card_ids: Vec<String>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for (i, id) in card_ids.iter().enumerate() {
        tx.execute(
            "UPDATE cards SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![i as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn query_unified_cards(
    conn: &rusqlite::Connection,
    filters: &CardFilter,
) -> Result<Vec<UnifiedCard>, String> {
    let mut sql = String::from(
        "SELECT
            ca.id, ca.title, ca.due_date, ca.start_date, ca.color, ca.sort_order, ca.completed,
            co.id, co.name, co.status_category,
            b.id, b.name,
            p.id, p.name, p.color,
            COALESCE((SELECT COUNT(*) FROM subtasks s WHERE s.card_id = ca.id), 0),
            COALESCE((SELECT COUNT(*) FROM subtasks s WHERE s.card_id = ca.id AND s.completed = 1), 0),
            COALESCE((SELECT json_group_array(json_object('id', t.id, 'name', t.name, 'color', t.color))
              FROM card_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.card_id = ca.id), '[]')
         FROM cards ca
         JOIN columns co ON co.id = ca.column_id
         JOIN boards b ON b.id = co.board_id
         JOIN projects p ON p.id = b.project_id
         WHERE 1=1",
    );
    let mut param_values: Vec<String> = Vec::new();

    if let Some(pids) = &filters.project_ids {
        if !pids.is_empty() {
            let placeholders: Vec<String> = pids.iter().enumerate().map(|(i, _)| format!("?{}", param_values.len() + i + 1)).collect();
            sql.push_str(&format!(" AND p.id IN ({})", placeholders.join(",")));
            param_values.extend(pids.clone());
        }
    }

    if let Some(bids) = &filters.board_ids {
        if !bids.is_empty() {
            let placeholders: Vec<String> = bids.iter().enumerate().map(|(i, _)| format!("?{}", param_values.len() + i + 1)).collect();
            sql.push_str(&format!(" AND b.id IN ({})", placeholders.join(",")));
            param_values.extend(bids.clone());
        }
    }

    if let Some(cats) = &filters.status_categories {
        if !cats.is_empty() {
            let placeholders: Vec<String> = cats.iter().enumerate().map(|(i, _)| format!("?{}", param_values.len() + i + 1)).collect();
            sql.push_str(&format!(" AND co.status_category IN ({})", placeholders.join(",")));
            param_values.extend(cats.clone());
        }
    }

    if let Some(from) = &filters.due_date_from {
        param_values.push(from.clone());
        sql.push_str(&format!(" AND ca.due_date >= ?{}", param_values.len()));
    }

    if let Some(to) = &filters.due_date_to {
        param_values.push(to.clone());
        sql.push_str(&format!(" AND ca.due_date <= ?{}", param_values.len()));
    }

    if let Some(tag_ids) = &filters.tag_ids {
        if !tag_ids.is_empty() {
            let placeholders: Vec<String> = tag_ids.iter().enumerate().map(|(i, _)| format!("?{}", param_values.len() + i + 1)).collect();
            sql.push_str(&format!(
                " AND ca.id IN (SELECT card_id FROM card_tags WHERE tag_id IN ({}))",
                placeholders.join(",")
            ));
            param_values.extend(tag_ids.clone());
        }
    }

    if let Some(search) = &filters.search {
        if !search.trim().is_empty() {
            param_values.push(format!("%{}%", search.trim()));
            sql.push_str(&format!(" AND ca.title LIKE ?{}", param_values.len()));
        }
    }

    sql.push_str(" ORDER BY co.status_category, ca.sort_order ASC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values
        .iter()
        .map(|s| s as &dyn rusqlite::types::ToSql)
        .collect();

    let rows = stmt
        .query_map(params_refs.as_slice(), |row| {
            let tags_json: String = row.get(17)?;
            let tags: Vec<UnifiedCardTag> =
                serde_json::from_str(&tags_json).unwrap_or_default();
            Ok(UnifiedCard {
                card_id: row.get(0)?,
                title: row.get(1)?,
                due_date: row.get(2)?,
                start_date: row.get(3)?,
                color: row.get(4)?,
                sort_order: row.get(5)?,
                completed: row.get::<_, i64>(6)? != 0,
                column_id: row.get(7)?,
                column_name: row.get(8)?,
                status_category: row.get(9)?,
                board_id: row.get(10)?,
                board_name: row.get(11)?,
                project_id: row.get(12)?,
                project_name: row.get(13)?,
                project_color: row.get(14)?,
                subtask_total: row.get(15)?,
                subtask_done: row.get(16)?,
                tags,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
