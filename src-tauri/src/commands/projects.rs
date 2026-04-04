use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::db::connection::DbState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub color: String,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProject {
    pub name: Option<String>,
    pub color: Option<String>,
    pub sort_order: Option<i64>,
}

#[tauri::command]
pub fn create_project(
    db: State<DbState>,
    name: String,
    color: Option<String>,
) -> Result<Project, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let color = color.unwrap_or_else(|| "#6366f1".to_string());

    let max_order: i64 = conn
        .query_row("SELECT COALESCE(MAX(sort_order), -1) FROM projects", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO projects (name, color, sort_order) VALUES (?1, ?2, ?3)",
        params![name, color, max_order + 1],
    )
    .map_err(|e| e.to_string())?;

    let id: String = conn
        .query_row("SELECT id FROM projects WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    get_project_by_id(&conn, &id)
}

#[tauri::command]
pub fn get_projects(db: State<DbState>) -> Result<Vec<Project>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, color, sort_order, created_at, updated_at FROM projects ORDER BY sort_order ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_project(
    db: State<DbState>,
    id: String,
    updates: UpdateProject,
) -> Result<Project, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    if let Some(name) = &updates.name {
        conn.execute(
            "UPDATE projects SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![name, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(color) = &updates.color {
        conn.execute(
            "UPDATE projects SET color = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![color, id],
        )
        .map_err(|e| e.to_string())?;
    }
    if let Some(sort_order) = updates.sort_order {
        conn.execute(
            "UPDATE projects SET sort_order = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![sort_order, id],
        )
        .map_err(|e| e.to_string())?;
    }

    get_project_by_id(&conn, &id)
}

#[tauri::command]
pub fn delete_project(db: State<DbState>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn get_project_by_id(conn: &rusqlite::Connection, id: &str) -> Result<Project, String> {
    conn.query_row(
        "SELECT id, name, color, sort_order, created_at, updated_at FROM projects WHERE id = ?1",
        params![id],
        |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                sort_order: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
