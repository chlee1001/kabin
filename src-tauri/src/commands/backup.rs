use rusqlite::Connection;
use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

use crate::db::backup::perform_backup;
use crate::db::connection::{get_db_path, DbState};

#[derive(Debug, Serialize)]
pub struct BackupInfo {
    pub file_path: String,
    pub created_at: String,
}

fn get_backup_dir(app: &AppHandle) -> PathBuf {
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    app_dir.join("backups")
}

#[tauri::command]
pub fn create_backup(db: State<DbState>, app: AppHandle) -> Result<BackupInfo, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let backup_dir = get_backup_dir(&app);
    let file_path = perform_backup(&conn, &backup_dir)?;
    Ok(BackupInfo {
        file_path,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn get_last_backup_time(app: AppHandle) -> Result<Option<String>, String> {
    let backup_dir = get_backup_dir(&app);
    if !backup_dir.exists() {
        return Ok(None);
    }

    let mut entries: Vec<_> = std::fs::read_dir(&backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_name()
                .to_string_lossy()
                .starts_with("kanban_backup_")
        })
        .collect();

    entries.sort_by_key(|e| e.file_name());

    if let Some(last) = entries.last() {
        let metadata = last.metadata().map_err(|e| e.to_string())?;
        if let Ok(modified) = metadata.modified() {
            let dt: chrono::DateTime<chrono::Local> = modified.into();
            return Ok(Some(dt.to_rfc3339()));
        }
    }

    Ok(None)
}

#[tauri::command]
pub fn export_backup(db: State<DbState>, path: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let export_path = PathBuf::from(&path);

    // Use temp file + rename for atomicity
    let temp_path = export_path.with_extension("tmp");

    conn.execute_batch(&format!(
        "VACUUM INTO '{}';",
        temp_path.to_string_lossy().replace('\'', "''")
    ))
    .map_err(|e| e.to_string())?;

    std::fs::rename(&temp_path, &export_path).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn import_backup(db: State<DbState>, app: AppHandle, path: String) -> Result<(), String> {
    let import_path = PathBuf::from(&path);

    if !import_path.exists() {
        return Err("File not found".to_string());
    }

    // 1. Validate the imported file is a valid SQLite database
    let test_conn = Connection::open(&import_path).map_err(|e| e.to_string())?;
    let integrity: String = test_conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    if integrity != "ok" {
        return Err(format!("Invalid database file: {}", integrity));
    }
    drop(test_conn);

    // 2. Auto-backup current DB before replacing
    let backup_dir = app
        .path()
        .app_data_dir()
        .expect("app data dir")
        .join("backups");
    {
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        perform_backup(&conn, &backup_dir)?;
    }

    // 3. Replace current DB with imported file
    let db_path = get_db_path(&app);
    {
        let mut conn = db.0.lock().map_err(|e| e.to_string())?;

        // Close current connection by replacing with a temporary in-memory one
        let placeholder = Connection::open_in_memory().map_err(|e| e.to_string())?;
        let old_conn = std::mem::replace(&mut *conn, placeholder);
        drop(old_conn);

        // Copy imported file over the DB
        std::fs::copy(&import_path, &db_path).map_err(|e| e.to_string())?;

        // Reopen connection to the replaced DB
        let new_conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
        new_conn.execute_batch("PRAGMA journal_mode=WAL;").map_err(|e| e.to_string())?;
        new_conn.execute_batch("PRAGMA foreign_keys=ON;").map_err(|e| e.to_string())?;
        new_conn.execute_batch("PRAGMA busy_timeout=5000;").map_err(|e| e.to_string())?;
        *conn = new_conn;
    }

    Ok(())
}
