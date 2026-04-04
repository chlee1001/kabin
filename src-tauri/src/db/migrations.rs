use rusqlite::Connection;

pub fn run(conn: &Connection) {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS projects (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name        TEXT NOT NULL,
            color       TEXT NOT NULL DEFAULT '#6366f1',
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS boards (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS columns (
            id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            board_id         TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
            name             TEXT NOT NULL,
            sort_order       INTEGER NOT NULL DEFAULT 0,
            status_category  TEXT NOT NULL DEFAULT 'other'
                             CHECK (status_category IN ('todo', 'in_progress', 'done', 'other')),
            created_at       TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS cards (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            column_id   TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '{}',
            start_date  TEXT,
            due_date    TEXT,
            color       TEXT,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS subtasks (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            card_id     TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            completed   INTEGER NOT NULL DEFAULT 0,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS tags (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name        TEXT NOT NULL UNIQUE,
            color       TEXT NOT NULL DEFAULT '#94a3b8'
        );

        CREATE TABLE IF NOT EXISTS card_tags (
            card_id     TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
            tag_id      TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (card_id, tag_id)
        );

        CREATE TABLE IF NOT EXISTS backups (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            file_path   TEXT NOT NULL,
            size_bytes  INTEGER,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key         TEXT PRIMARY KEY,
            value       TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_boards_project ON boards(project_id);
        CREATE INDEX IF NOT EXISTS idx_columns_board ON columns(board_id);
        CREATE INDEX IF NOT EXISTS idx_cards_column ON cards(column_id);
        CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date);
        CREATE INDEX IF NOT EXISTS idx_cards_start_date ON cards(start_date);
        CREATE INDEX IF NOT EXISTS idx_subtasks_card ON subtasks(card_id);
        CREATE INDEX IF NOT EXISTS idx_card_tags_card ON card_tags(card_id);
        CREATE INDEX IF NOT EXISTS idx_card_tags_tag ON card_tags(tag_id);

        DROP TABLE IF EXISTS cards_fts;
        CREATE VIRTUAL TABLE cards_fts USING fts5(
            title, description_text
        );

        -- Rebuild FTS index from existing cards
        INSERT INTO cards_fts(rowid, title, description_text)
        SELECT rowid, title, '' FROM cards;
        ",
    )
    .expect("failed to run migrations");
}

pub fn run_v2(conn: &Connection) {
    let boards_cols: [(&str, &str); 2] = [
        ("background_type", "ALTER TABLE boards ADD COLUMN background_type TEXT"),
        ("background_value", "ALTER TABLE boards ADD COLUMN background_value TEXT"),
    ];
    for (col_name, alter_sql) in &boards_cols {
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('boards') WHERE name=?1",
                rusqlite::params![col_name],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if exists == 0 {
            conn.execute(alter_sql, []).expect("failed to add boards column");
        }
    }

    let cards_cols: [(&str, &str); 1] = [
        ("completed", "ALTER TABLE cards ADD COLUMN completed INTEGER NOT NULL DEFAULT 0"),
    ];
    for (col_name, alter_sql) in &cards_cols {
        let exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('cards') WHERE name=?1",
                rusqlite::params![col_name],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if exists == 0 {
            conn.execute(alter_sql, []).expect("failed to add cards column");
        }
    }
}

pub fn run_v3(conn: &Connection) {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS card_templates (
            id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            board_id    TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            title       TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '{}',
            color       TEXT,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS idx_card_templates_board ON card_templates(board_id);
        ",
    )
    .expect("failed to run v3 migrations");
}
