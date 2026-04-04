<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# commands

## Purpose
Tauri IPC command handlers organized by domain entity. Each module exposes `#[tauri::command]` functions that the React frontend invokes.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module declarations exporting all command submodules |
| `projects.rs` | CRUD for projects: create, list, update, delete |
| `boards.rs` | CRUD for boards + background image save + clone board |
| `columns.rs` | CRUD for columns with status categories (todo/in_progress/done/other) + reorder |
| `cards.rs` | CRUD for cards + move between columns + reorder; handles Tiptap JSON extraction |
| `subtasks.rs` | CRUD for subtasks + reorder |
| `tags.rs` | CRUD for tags + add/remove card-tag associations |
| `dashboard.rs` | Aggregated queries: ProjectSummary (card counts by status), UrgentCard (overdue items) |
| `unified.rs` | Cross-project queries: cards by status category, filtered card list, move by status |
| `search.rs` | Full-text search via SQLite FTS5: global_search returning snippets |
| `backup.rs` | Backup operations: create_backup, get_last_backup_time |
| `settings.rs` | Key-value settings: get/set/delete setting |

## For AI Agents

### Working In This Directory
- Every public function must have `#[tauri::command]` attribute
- Commands take `State<'_, DbState>` for database access
- Return `Result<T, String>` where T is serde-serializable
- New commands must be registered in `../lib.rs` invoke_handler
- SQL queries use rusqlite parameterized queries (prevent injection)

### Testing Requirements
- Add integration tests in `../../tests/integration_test.rs`
- Use in-memory SQLite for test isolation

### Common Patterns
- `let conn = db.0.lock().unwrap();` to acquire DB connection
- `conn.query_row` for single results, `conn.prepare().query_map()` for lists
- Timestamps use `chrono::Local::now().to_rfc3339()`

## Dependencies

### Internal
- `../db/` — DbState, database connection

### External
- `rusqlite`, `serde`, `chrono`, `tauri`

<!-- MANUAL: -->
