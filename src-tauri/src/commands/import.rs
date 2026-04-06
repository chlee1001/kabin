use std::fs;
use tauri::State;

use crate::db::connection::DbState;
use crate::import::{ImportPreview, ImportSource};

const MAX_FILE_SIZE: u64 = 50 * 1024 * 1024; // 50MB

fn read_and_parse(path: &str, source: &ImportSource) -> Result<crate::import::ImportData, String> {
    let metadata = fs::metadata(path).map_err(|e| format!("Cannot read file: {}", e))?;
    if metadata.len() > MAX_FILE_SIZE {
        return Err("File is too large (max 50MB)".to_string());
    }
    let content = fs::read_to_string(path).map_err(|e| format!("Cannot read file: {}", e))?;
    match source {
        ImportSource::Kanri => crate::import::kanri::parse(&content),
        ImportSource::Trello => crate::import::trello::parse(&content),
    }
}

#[tauri::command]
pub fn preview_import(path: String, source: ImportSource) -> Result<ImportPreview, String> {
    let data = read_and_parse(&path, &source)?;
    Ok(data.preview())
}

#[tauri::command]
pub fn execute_import(
    db: State<DbState>,
    path: String,
    source: ImportSource,
) -> Result<String, String> {
    let data = read_and_parse(&path, &source)?;
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::import::writer::write_import(&conn, data)
}
