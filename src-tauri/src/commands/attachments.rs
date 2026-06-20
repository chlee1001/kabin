use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

use crate::db::connection::DbState;

/// Max attachment size: 50 MB.
const MAX_SIZE_BYTES: u64 = 50 * 1024 * 1024;

/// Allowed file extensions (whitelist). Lowercase, without dot.
const ALLOWED_EXTS: &[&str] = &[
    // images (SVG excluded — can embed scripts that run when opened in a browser)
    "png", "jpg", "jpeg", "webp", "gif", "bmp",
    // documents
    "pdf", "txt", "md", "csv", "rtf",
    "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp", "hwpx",
    // archives
    "zip",
];

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attachment {
    pub id: String,
    pub card_id: String,
    pub original_name: String,
    pub stored_path: String, // relative: attachments/{id}.ext
    pub mime_type: Option<String>,
    pub extension: Option<String>,
    pub size_bytes: Option<i64>,
    pub thumb_path: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
    /// Absolute path for `convertFileSrc` on the frontend (computed, not stored).
    pub src: String,
}

fn attachments_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("attachments");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn mime_for(ext: &str) -> Option<String> {
    let m = match ext {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        "pdf" => "application/pdf",
        "txt" | "md" => "text/plain",
        "csv" => "text/csv",
        "zip" => "application/zip",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt" => "application/vnd.ms-powerpoint",
        "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        _ => return None,
    };
    Some(m.to_string())
}

/// Build the absolute `src` path for a stored (relative) attachment path.
fn to_src(base: &PathBuf, stored_path: &str) -> String {
    base.join(stored_path).to_string_lossy().to_string()
}

#[tauri::command]
pub fn add_card_attachment(
    db: State<DbState>,
    app: AppHandle,
    card_id: String,
    source_path: String,
) -> Result<Attachment, String> {
    let source = PathBuf::from(&source_path);

    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    if ext.is_empty() || !ALLOWED_EXTS.contains(&ext.as_str()) {
        return Err(format!("지원하지 않는 파일 형식입니다: {}", source_path));
    }

    let canonical = source
        .canonicalize()
        .map_err(|_| "잘못된 파일 경로입니다".to_string())?;
    if !canonical.is_file() {
        return Err("파일이 아닙니다".to_string());
    }
    let size = std::fs::metadata(&canonical).map_err(|e| e.to_string())?.len();
    if size > MAX_SIZE_BYTES {
        return Err("파일이 너무 큽니다 (최대 50MB)".to_string());
    }

    let original_name = canonical
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| format!("file.{}", ext));

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let dir = attachments_dir(&app)?;

    // Reuse the row id as the on-disk filename (DEC-4).
    let id: String = conn
        .query_row("SELECT lower(hex(randomblob(16)))", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let stored_rel = format!("attachments/{}.{}", id, ext);
    let dest = dir.join(format!("{}.{}", id, ext));

    std::fs::copy(&canonical, &dest).map_err(|e| e.to_string())?;

    // The DbState mutex (held above) serializes all commands, so this
    // read-then-insert of sort_order is safe from races within the process.
    let max_order: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort_order), -1) FROM card_attachments WHERE card_id = ?1",
            params![card_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let insert = conn.execute(
        "INSERT INTO card_attachments \
         (id, card_id, original_name, stored_path, mime_type, extension, size_bytes, sort_order) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            id,
            card_id,
            original_name,
            stored_rel,
            mime_for(&ext),
            ext,
            size as i64,
            max_order + 1
        ],
    );
    if let Err(e) = insert {
        // INSERT failed → don't leave the copied file orphaned.
        let _ = std::fs::remove_file(&dest);
        return Err(e.to_string());
    }

    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, card_id, original_name, stored_path, mime_type, extension, size_bytes, thumb_path, sort_order, created_at \
         FROM card_attachments WHERE id = ?1",
        params![id],
        |row| {
            let stored_path: String = row.get(3)?;
            Ok(Attachment {
                id: row.get(0)?,
                card_id: row.get(1)?,
                original_name: row.get(2)?,
                src: to_src(&base, &stored_path),
                stored_path,
                mime_type: row.get(4)?,
                extension: row.get(5)?,
                size_bytes: row.get(6)?,
                thumb_path: row.get(7)?,
                sort_order: row.get(8)?,
                created_at: row.get(9)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_card_attachments(
    db: State<DbState>,
    app: AppHandle,
    card_id: String,
) -> Result<Vec<Attachment>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, card_id, original_name, stored_path, mime_type, extension, size_bytes, thumb_path, sort_order, created_at \
             FROM card_attachments WHERE card_id = ?1 ORDER BY sort_order ASC, created_at ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![card_id], |row| {
            let stored_path: String = row.get(3)?;
            Ok(Attachment {
                id: row.get(0)?,
                card_id: row.get(1)?,
                original_name: row.get(2)?,
                src: to_src(&base, &stored_path),
                stored_path,
                mime_type: row.get(4)?,
                extension: row.get(5)?,
                size_bytes: row.get(6)?,
                thumb_path: row.get(7)?,
                sort_order: row.get(8)?,
                created_at: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_card_attachment(
    db: State<DbState>,
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let stored: Option<String> = conn
        .query_row(
            "SELECT stored_path FROM card_attachments WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM card_attachments WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    if let Some(sp) = stored {
        if let Ok(base) = app.path().app_data_dir() {
            let _ = std::fs::remove_file(base.join(sp));
        }
    }
    Ok(())
}

/// Open an attachment with the OS default application (OPEN-3).
#[tauri::command]
pub fn open_attachment(db: State<DbState>, app: AppHandle, id: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    let stored: String = {
        let conn = db.0.lock().map_err(|e| e.to_string())?;
        conn.query_row(
            "SELECT stored_path FROM card_attachments WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?
    };
    let abs = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join(stored);
    if !abs.is_file() {
        return Err("파일을 찾을 수 없습니다".to_string());
    }
    app.opener()
        .open_path(abs.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| e.to_string())
}

/// Collect `stored_path` values for every card matched by `select_sql` (a query
/// returning `stored_path`, bound to a single `?1` id). Call this **before** the
/// cascade DELETE, then `remove_files` **after** the DELETE commits — so a failed
/// DELETE never leaves dangling rows without files. Leftovers from a crash in
/// between are swept by `gc_orphan_attachments`.
pub fn collect_attachment_paths(conn: &Connection, select_sql: &str, id: &str) -> Vec<String> {
    let mut paths = Vec::new();
    if let Ok(mut stmt) = conn.prepare(select_sql) {
        if let Ok(rows) = stmt.query_map(params![id], |r| r.get::<_, String>(0)) {
            paths.extend(rows.flatten());
        }
    }
    paths
}

/// Best-effort removal of physical attachment files by their stored (relative) paths.
pub fn remove_files(app: &AppHandle, stored_paths: &[String]) {
    if let Ok(base) = app.path().app_data_dir() {
        for sp in stored_paths {
            let _ = std::fs::remove_file(base.join(sp));
        }
    }
}

/// Copy every attachment of `src_card_id` to `dst_card_id` with fresh ids and
/// physically copied files (DEC-8 — never share a file between cards).
pub fn clone_attachments(
    app: &AppHandle,
    conn: &Connection,
    src_card_id: &str,
    dst_card_id: &str,
) -> Result<(), String> {
    // `stored_path` is relative to app_data_dir, such as "attachments/{id}.ext".
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(base.join("attachments")).map_err(|e| e.to_string())?;

    let rows: Vec<(String, String, Option<String>, Option<String>, Option<i64>, i64)> = {
        let mut stmt = conn
            .prepare(
                "SELECT original_name, stored_path, mime_type, extension, size_bytes, sort_order \
                 FROM card_attachments WHERE card_id = ?1 ORDER BY sort_order ASC",
            )
            .map_err(|e| e.to_string())?;
        let mapped = stmt
            .query_map(params![src_card_id], |r| {
                Ok((
                    r.get(0)?,
                    r.get(1)?,
                    r.get(2)?,
                    r.get(3)?,
                    r.get(4)?,
                    r.get(5)?,
                ))
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        mapped
    };

    for (name, stored, mime, ext, size, order) in rows {
        let new_id: String = conn
            .query_row("SELECT lower(hex(randomblob(16)))", [], |r| r.get(0))
            .map_err(|e| e.to_string())?;
        let new_rel = match &ext {
            Some(e) if !e.is_empty() => format!("attachments/{}.{}", new_id, e),
            _ => format!("attachments/{}", new_id),
        };
        // Copy the physical file; if the source is missing/unreadable, skip the
        // row entirely rather than inserting a row that points at no file.
        if std::fs::copy(base.join(&stored), base.join(&new_rel)).is_err() {
            continue;
        }

        conn.execute(
            "INSERT INTO card_attachments \
             (id, card_id, original_name, stored_path, mime_type, extension, size_bytes, sort_order) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![new_id, dst_card_id, name, new_rel, mime, ext, size, order],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Sweep attachment files on disk that have no referencing DB row (safety net
/// for crashes / failed cleanups / `import_backup` DB swaps). Returns removed count.
pub fn run_gc(conn: &Connection, app: &AppHandle) -> Result<u32, String> {
    let dir = attachments_dir(app)?;

    let mut referenced: HashSet<String> = HashSet::new();
    {
        let mut stmt = conn
            .prepare("SELECT stored_path FROM card_attachments")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |r| r.get::<_, String>(0))
            .map_err(|e| e.to_string())?;
        for sp in rows.flatten() {
            if let Some(name) = PathBuf::from(&sp).file_name() {
                referenced.insert(name.to_string_lossy().to_string());
            }
        }
    }

    let mut removed = 0u32;
    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            if !referenced.contains(&name) && std::fs::remove_file(&path).is_ok() {
                removed += 1;
            }
        }
    }
    Ok(removed)
}

/// Startup orphan sweep — locks the DB state itself; best-effort, errors ignored.
pub fn run_startup_gc(app: &AppHandle) {
    if let Some(state) = app.try_state::<DbState>() {
        if let Ok(conn) = state.0.lock() {
            let _ = run_gc(&conn, app);
        }
    }
}

#[tauri::command]
pub fn gc_orphan_attachments(db: State<DbState>, app: AppHandle) -> Result<u32, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    run_gc(&conn, &app)
}
