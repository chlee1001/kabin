use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;

pub fn perform_backup(conn: &Connection, backup_dir: &PathBuf) -> Result<String, String> {
    fs::create_dir_all(backup_dir).map_err(|e| e.to_string())?;

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let backup_filename = format!("kanban_backup_{}.db", timestamp);
    let temp_path = backup_dir.join(format!(".{}.tmp", backup_filename));
    let final_path = backup_dir.join(&backup_filename);

    // VACUUM INTO creates a consistent backup atomically
    conn.execute_batch(&format!(
        "VACUUM INTO '{}';",
        temp_path.to_string_lossy().replace('\'', "''")
    ))
    .map_err(|e| e.to_string())?;

    // Atomic rename
    fs::rename(&temp_path, &final_path).map_err(|e| e.to_string())?;

    // Prune old backups (keep last 10)
    prune_backups(backup_dir, 10)?;

    Ok(final_path.to_string_lossy().to_string())
}

fn prune_backups(backup_dir: &PathBuf, keep: usize) -> Result<(), String> {
    let mut entries: Vec<_> = fs::read_dir(backup_dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_name()
                .to_string_lossy()
                .starts_with("kanban_backup_")
        })
        .collect();

    entries.sort_by_key(|e| e.file_name());

    if entries.len() > keep {
        for entry in &entries[..entries.len() - keep] {
            if let Err(e) = fs::remove_file(entry.path()) {
                eprintln!("[backup] failed to prune {}: {}", entry.path().display(), e);
            }
        }
    }

    Ok(())
}
