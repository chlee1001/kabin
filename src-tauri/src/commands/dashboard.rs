use serde::Serialize;
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize)]
pub struct ProjectSummary {
    pub id: String,
    pub name: String,
    pub color: String,
    pub total_cards: i64,
    pub todo_count: i64,
    pub in_progress_count: i64,
    pub done_count: i64,
    pub other_count: i64,
    pub urgent_count: i64,
}

#[derive(Debug, Serialize)]
pub struct UrgentCard {
    pub card_id: String,
    pub title: String,
    pub due_date: String,
    pub project_id: String,
    pub project_name: String,
    pub project_color: String,
    pub board_id: String,
    pub board_name: String,
    pub status_category: String,
    pub column_name: String,
}

#[tauri::command]
pub fn get_project_summaries(db: State<DbState>) -> Result<Vec<ProjectSummary>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT
                p.id, p.name, p.color,
                COUNT(ca.id) as total_cards,
                SUM(CASE WHEN co.status_category = 'todo' THEN 1 ELSE 0 END) as todo_count,
                SUM(CASE WHEN co.status_category = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN co.status_category = 'done' THEN 1 ELSE 0 END) as done_count,
                SUM(CASE WHEN co.status_category = 'other' THEN 1 ELSE 0 END) as other_count,
                SUM(CASE WHEN ca.due_date IS NOT NULL AND ca.due_date <= date('now', '+5 days') AND co.status_category != 'done' AND ca.completed = 0 THEN 1 ELSE 0 END) as urgent_count
             FROM projects p
             LEFT JOIN boards b ON b.project_id = p.id
             LEFT JOIN columns co ON co.board_id = b.id
             LEFT JOIN cards ca ON ca.column_id = co.id
             GROUP BY p.id
             ORDER BY p.sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ProjectSummary {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                total_cards: row.get(3)?,
                todo_count: row.get(4)?,
                in_progress_count: row.get(5)?,
                done_count: row.get(6)?,
                other_count: row.get(7)?,
                urgent_count: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_urgent_cards(db: State<DbState>) -> Result<Vec<UrgentCard>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT
                ca.id, ca.title, ca.due_date,
                p.id, p.name, p.color,
                b.id, b.name,
                co.status_category, co.name
             FROM cards ca
             JOIN columns co ON co.id = ca.column_id
             JOIN boards b ON b.id = co.board_id
             JOIN projects p ON p.id = b.project_id
             WHERE ca.due_date IS NOT NULL
               AND ca.due_date <= date('now', '+5 days')
               AND co.status_category != 'done'
               AND ca.completed = 0
             ORDER BY ca.due_date ASC
             LIMIT 50",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(UrgentCard {
                card_id: row.get(0)?,
                title: row.get(1)?,
                due_date: row.get(2)?,
                project_id: row.get(3)?,
                project_name: row.get(4)?,
                project_color: row.get(5)?,
                board_id: row.get(6)?,
                board_name: row.get(7)?,
                status_category: row.get(8)?,
                column_name: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}
