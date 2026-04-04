<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# src-tauri

## Purpose
Tauri 2 Rust backend providing SQLite persistence, IPC command handlers, backup management, and full-text search for the Kanban application.

## Key Files

| File | Description |
|------|-------------|
| `Cargo.toml` | Rust dependencies: tauri 2, rusqlite, serde, chrono |
| `tauri.conf.json` | Tauri config: window 1280x800, app identifier `com.kanban.app` |
| `build.rs` | Tauri build script |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | Rust source: main entry, lib setup, commands, and DB layer (see `src/AGENTS.md`) |
| `capabilities/` | Tauri security capability definitions for window permissions |
| `tests/` | Integration tests using in-memory SQLite |
| `gen/` | Auto-generated Tauri schemas (do not edit) |
| `icons/` | App icons for all platforms |

## For AI Agents

### Working In This Directory
- Build with `cargo build` from this directory
- Test with `cargo test` from this directory
- Database is SQLite at `{app_data_dir}/kanban.db` using WAL mode
- All IPC commands are registered in `src/lib.rs`
- Migrations run automatically on startup in `src/db/connection.rs`
- Backups run automatically every 60 seconds and on window close

### Testing Requirements
- Integration tests in `tests/integration_test.rs` use in-memory SQLite
- Run `cargo test` to execute all tests

### Common Patterns
- Each domain has its own command module in `src/commands/`
- Commands take `State<DbState>` for database access
- All responses are serialized via serde
- Errors returned as `Result<T, String>`

## Dependencies

### External
- `tauri` 2.x — desktop framework
- `rusqlite` 0.32 — SQLite with bundled build
- `serde` / `serde_json` — serialization
- `chrono` — date/time handling

<!-- MANUAL: -->
