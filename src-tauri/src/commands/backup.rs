use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

use crate::db::backup::perform_backup;
use crate::db::connection::DbState;

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
