<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# db

## Purpose
SQLite database layer: connection management, schema migrations, and backup operations.

## Key Files

| File | Description |
|------|-------------|
| `mod.rs` | Module declarations for connection, migrations, backup |
| `connection.rs` | Database init: creates `DbState` (Mutex-wrapped Connection), enables WAL mode + foreign keys, sets busy timeout, runs migrations, stores DB at `{app_data_dir}/kanban.db` |
| `migrations.rs` | Schema definitions: 8 tables (projects, boards, columns, cards, subtasks, tags, card_tags, settings) + FTS5 search index; v2 migration adds board backgrounds and card completion |
| `backup.rs` | Backup via SQLite `VACUUM INTO`: timestamp-named files, keeps last 10, prunes older backups |

## For AI Agents

### Working In This Directory
- Schema changes require a new migration function (v3, v4, etc.) called from `connection.rs`
- Migrations are run sequentially on startup — they must be idempotent
- WAL mode is enabled for concurrent read performance
- `DbState` is `pub struct DbState(pub Mutex<Connection>)` — all access requires lock
- Backup uses `VACUUM INTO` for atomic, consistent copies

### Testing Requirements
- Schema changes should be tested via in-memory SQLite in `../../tests/`
- Verify migrations are backward-compatible (don't break existing data)

### Common Patterns
- `CREATE TABLE IF NOT EXISTS` for idempotent migrations
- `ALTER TABLE ... ADD COLUMN` in versioned migration functions
- Backup files: `kanban_backup_YYYYMMDD_HHMMSS.db`

## Dependencies

### External
- `rusqlite` — SQLite connection and query execution
- `chrono` — timestamp generation for backups

<!-- MANUAL: -->
