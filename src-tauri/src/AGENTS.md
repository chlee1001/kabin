<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# src (Rust)

## Purpose
Core Rust source code: application entry point, Tauri setup, IPC command modules, and SQLite database layer.

## Key Files

| File | Description |
|------|-------------|
| `main.rs` | Desktop entry point, calls `kanban_lib::run()` |
| `lib.rs` | Tauri app setup: DB init, command registration, periodic backup (60s), window close handler |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `commands/` | Tauri IPC command handlers for each domain entity (see `commands/AGENTS.md`) |
| `db/` | SQLite database: connection, migrations, backup (see `db/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `lib.rs` registers all Tauri commands — add new commands here
- Commands are organized by domain in `commands/` submodules
- Database state is shared via `State<DbState>` (thread-safe Mutex wrapper)
- Backup runs every 60 seconds via a spawned async task

### Common Patterns
- `#[tauri::command]` attribute on public functions
- `State<'_, DbState>` parameter for database access
- `Result<T, String>` return type for all commands
- Serde `Serialize`/`Deserialize` on all data structs

## Dependencies

### Internal
- `commands/` — IPC handlers
- `db/` — database operations

<!-- MANUAL: -->
