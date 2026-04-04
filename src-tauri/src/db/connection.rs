use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

use super::migrations;

pub struct DbState(pub Mutex<Connection>);

pub fn get_db_path(app: &AppHandle) -> PathBuf {
    let app_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    fs::create_dir_all(&app_dir).expect("failed to create app data dir");
    app_dir.join("kanban.db")
}

pub fn init_db(app: &AppHandle) -> Connection {
    let db_path = get_db_path(app);
    let conn = Connection::open(&db_path).expect("failed to open database");

    conn.execute_batch("PRAGMA journal_mode=WAL;").unwrap();
    conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();
    conn.execute_batch("PRAGMA busy_timeout=5000;").unwrap();

    migrations::run(&conn);
    migrations::run_v2(&conn);
    migrations::run_v3(&conn);

    conn
}
