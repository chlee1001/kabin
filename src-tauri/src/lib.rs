mod commands;
mod db;

use db::backup::perform_backup;
use db::connection::{init_db, DbState};
use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let conn = init_db(&app.handle());
            app.manage(DbState(Mutex::new(conn)));

            // Periodic auto-backup with configurable interval
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                let mut elapsed_secs: u64 = 0;
                loop {
                    std::thread::sleep(Duration::from_secs(60));
                    elapsed_secs += 60;

                    let interval = handle.state::<DbState>().0.lock()
                        .ok()
                        .and_then(|conn| {
                            conn.query_row(
                                "SELECT value FROM settings WHERE key = 'backup_interval_secs'",
                                [],
                                |row| row.get::<_, String>(0),
                            ).ok()
                        })
                        .and_then(|v| v.parse::<u64>().ok())
                        .unwrap_or(3600);

                    // 0 means manual-only
                    if interval == 0 || elapsed_secs < interval {
                        continue;
                    }

                    elapsed_secs = 0;
                    let backup_dir = handle
                        .path()
                        .app_data_dir()
                        .expect("app data dir")
                        .join("backups");
                    match handle.state::<DbState>().0.lock() {
                        Ok(guard) => {
                            if let Err(e) = perform_backup(&guard, &backup_dir) {
                                eprintln!("[backup] periodic backup failed: {}", e);
                            }
                        }
                        Err(e) => eprintln!("[backup] failed to acquire db lock: {}", e),
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let handle = window.app_handle();
                let backup_dir = handle
                    .path()
                    .app_data_dir()
                    .expect("app data dir")
                    .join("backups");
                let db_state = handle.state::<DbState>();
                let lock_result = db_state.0.lock();
                match lock_result {
                    Ok(guard) => {
                        if let Err(e) = perform_backup(&guard, &backup_dir) {
                            eprintln!("[backup] shutdown backup failed: {}", e);
                        }
                    }
                    Err(e) => eprintln!("[backup] failed to acquire db lock on shutdown: {}", e),
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Projects
            commands::projects::create_project,
            commands::projects::get_projects,
            commands::projects::update_project,
            commands::projects::delete_project,
            // Boards
            commands::boards::create_board,
            commands::boards::get_board,
            commands::boards::get_boards,
            commands::boards::get_all_boards,
            commands::boards::update_board,
            commands::boards::delete_board,
            commands::boards::save_board_background_image,
            commands::boards::clone_board,
            commands::boards::move_board,
            // Columns
            commands::columns::create_column,
            commands::columns::get_columns,
            commands::columns::update_column,
            commands::columns::delete_column,
            commands::columns::reorder_columns,
            // Cards
            commands::cards::create_card,
            commands::cards::get_cards,
            commands::cards::get_cards_enriched,
            commands::cards::get_card,
            commands::cards::get_card_location,
            commands::cards::update_card,
            commands::cards::delete_card,
            commands::cards::clone_card,
            commands::cards::move_card,
            commands::cards::reorder_cards,
            // Subtasks
            commands::subtasks::create_subtask,
            commands::subtasks::get_subtasks,
            commands::subtasks::update_subtask,
            commands::subtasks::delete_subtask,
            commands::subtasks::reorder_subtasks,
            // Dashboard
            commands::dashboard::get_project_summaries,
            commands::dashboard::get_urgent_cards,
            // Unified
            commands::unified::get_cards_by_status_category,
            commands::unified::get_all_cards_with_filters,
            commands::unified::move_card_by_status_category,
            // Search
            commands::search::global_search,
            // Backup
            commands::backup::create_backup,
            commands::backup::get_last_backup_time,
            commands::backup::export_backup,
            commands::backup::import_backup,
            // Tags
            commands::tags::create_tag,
            commands::tags::get_tags,
            commands::tags::update_tag,
            commands::tags::delete_tag,
            commands::tags::add_card_tag,
            commands::tags::remove_card_tag,
            commands::tags::get_card_tags,
            // Templates
            commands::templates::create_template,
            commands::templates::get_templates,
            commands::templates::update_template,
            commands::templates::delete_template,
            commands::templates::create_card_from_template,
            // Settings
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::delete_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
