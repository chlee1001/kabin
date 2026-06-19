use rusqlite::{params, Connection};

fn setup_db() -> Connection {
    let conn = Connection::open_in_memory().unwrap();
    conn.execute_batch("PRAGMA foreign_keys=ON;").unwrap();

    // Run migrations inline (same as migrations.rs)
    conn.execute_batch(
        "
        CREATE TABLE projects (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#6366f1',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE boards (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE columns (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            status_category TEXT NOT NULL DEFAULT 'other'
                CHECK (status_category IN ('todo', 'in_progress', 'done', 'other')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE cards (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '{}',
            start_date TEXT,
            due_date TEXT,
            color TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT
        );
        CREATE TABLE subtasks (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE tags (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#94a3b8'
        );
        CREATE TABLE card_tags (
            card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
            tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (card_id, tag_id)
        );
        CREATE TABLE card_attachments (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
            original_name TEXT NOT NULL,
            stored_path TEXT NOT NULL,
            mime_type TEXT,
            extension TEXT,
            size_bytes INTEGER,
            thumb_path TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX idx_card_attachments_card ON card_attachments(card_id);
        CREATE INDEX idx_boards_project ON boards(project_id);
        CREATE INDEX idx_columns_board ON columns(board_id);
        CREATE INDEX idx_cards_column ON cards(column_id);
        CREATE INDEX idx_cards_due_date ON cards(due_date);
        CREATE INDEX idx_subtasks_card ON subtasks(card_id);
        CREATE INDEX idx_card_tags_card ON card_tags(card_id);
        CREATE INDEX idx_card_tags_tag ON card_tags(tag_id);
        CREATE VIRTUAL TABLE cards_fts USING fts5(
            title, description_text
        );
        ",
    )
    .unwrap();
    conn
}

fn insert_project(conn: &Connection, name: &str) -> String {
    conn.execute(
        "INSERT INTO projects (name, sort_order) VALUES (?1, 0)",
        params![name],
    )
    .unwrap();
    conn.query_row(
        "SELECT id FROM projects WHERE rowid = last_insert_rowid()",
        [],
        |r| r.get(0),
    )
    .unwrap()
}

fn insert_board(conn: &Connection, project_id: &str, name: &str) -> String {
    conn.execute(
        "INSERT INTO boards (project_id, name, sort_order) VALUES (?1, ?2, 0)",
        params![project_id, name],
    )
    .unwrap();
    conn.query_row(
        "SELECT id FROM boards WHERE rowid = last_insert_rowid()",
        [],
        |r| r.get(0),
    )
    .unwrap()
}

fn insert_column(conn: &Connection, board_id: &str, name: &str, status: &str, order: i64) -> String {
    conn.execute(
        "INSERT INTO columns (board_id, name, sort_order, status_category) VALUES (?1, ?2, ?3, ?4)",
        params![board_id, name, order, status],
    )
    .unwrap();
    conn.query_row(
        "SELECT id FROM columns WHERE rowid = last_insert_rowid()",
        [],
        |r| r.get(0),
    )
    .unwrap()
}

fn insert_card(conn: &Connection, column_id: &str, title: &str, order: i64) -> String {
    conn.execute(
        "INSERT INTO cards (column_id, title, sort_order) VALUES (?1, ?2, ?3)",
        params![column_id, title, order],
    )
    .unwrap();
    let id: String = conn
        .query_row(
            "SELECT id FROM cards WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .unwrap();
    // FTS sync (standalone FTS table — use its own rowid)
    conn.execute(
        "INSERT INTO cards_fts(title, description_text) VALUES (?1, '')",
        params![title],
    )
    .unwrap();
    id
}

// ─── Tests ───────────────────────────────────────────────

#[test]
fn test_project_crud() {
    let conn = setup_db();

    // Create
    let id = insert_project(&conn, "Test Project");
    assert!(!id.is_empty());

    // Read
    let name: String = conn
        .query_row("SELECT name FROM projects WHERE id = ?1", params![id], |r| r.get(0))
        .unwrap();
    assert_eq!(name, "Test Project");

    // Update
    conn.execute(
        "UPDATE projects SET name = 'Updated', updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )
    .unwrap();
    let name: String = conn
        .query_row("SELECT name FROM projects WHERE id = ?1", params![id], |r| r.get(0))
        .unwrap();
    assert_eq!(name, "Updated");

    // Delete
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id]).unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM projects", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn test_board_crud() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "Board 1");

    let name: String = conn
        .query_row("SELECT name FROM boards WHERE id = ?1", params![board_id], |r| r.get(0))
        .unwrap();
    assert_eq!(name, "Board 1");

    // Cascade delete: deleting project should delete board
    conn.execute("DELETE FROM projects WHERE id = ?1", params![proj_id]).unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM boards", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn test_column_status_category() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");

    let col_id = insert_column(&conn, &board_id, "To Do", "todo", 0);
    let status: String = conn
        .query_row(
            "SELECT status_category FROM columns WHERE id = ?1",
            params![col_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(status, "todo");

    // Invalid status_category should fail
    let result = conn.execute(
        "INSERT INTO columns (board_id, name, sort_order, status_category) VALUES (?1, 'Bad', 1, 'invalid')",
        params![board_id],
    );
    assert!(result.is_err());
}

#[test]
fn test_card_crud_and_move() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col1_id = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let col2_id = insert_column(&conn, &board_id, "Done", "done", 1);

    let card_id = insert_card(&conn, &col1_id, "My Card", 0);

    // Verify card exists in col1
    let col: String = conn
        .query_row("SELECT column_id FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert_eq!(col, col1_id);

    // Move to col2
    conn.execute(
        "UPDATE cards SET column_id = ?1 WHERE id = ?2",
        params![col2_id, card_id],
    )
    .unwrap();
    let col: String = conn
        .query_row("SELECT column_id FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert_eq!(col, col2_id);
}

#[test]
fn test_completed_at_toggle() {
    // Mirrors update_card's completed branch: completed_at is auto-stamped from
    // the completed flag (set on true, cleared on false). Guards the CASE SQL.
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col_id = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let card_id = insert_card(&conn, &col_id, "Card", 0);

    let completed_at_sql =
        "UPDATE cards SET completed = ?1, \
         completed_at = CASE WHEN ?1 = 1 THEN datetime('now') ELSE NULL END, \
         updated_at = datetime('now') WHERE id = ?2";

    // Initially not completed → completed_at NULL
    let initial: Option<String> = conn
        .query_row("SELECT completed_at FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert_eq!(initial, None);

    // Mark complete → completed_at set
    conn.execute(completed_at_sql, params![1i64, card_id]).unwrap();
    let after_complete: Option<String> = conn
        .query_row("SELECT completed_at FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert!(after_complete.is_some(), "completing a card must stamp completed_at");

    // Un-complete → completed_at cleared to NULL
    conn.execute(completed_at_sql, params![0i64, card_id]).unwrap();
    let after_uncomplete: Option<String> = conn
        .query_row("SELECT completed_at FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert_eq!(after_uncomplete, None, "un-completing must clear completed_at");
}

#[test]
fn test_auto_complete_on_move_to_done_column() {
    // Mirrors move_card/reorder_cards: entering a done-category column auto-stamps
    // completed=1 + completed_at, guarded by `completed = 0` so it isn't re-stamped.
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let todo_col = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let done_col = insert_column(&conn, &board_id, "Done", "done", 1);
    let card_id = insert_card(&conn, &todo_col, "Card", 0);

    let is_done = |conn: &Connection, col: &str| -> bool {
        conn.query_row(
            "SELECT status_category = 'done' FROM columns WHERE id = ?1",
            params![col],
            |r| r.get::<_, i64>(0).map(|v| v != 0),
        )
        .unwrap_or(false)
    };
    let auto_complete = "UPDATE cards SET completed = 1, completed_at = datetime('now'), \
         updated_at = datetime('now') WHERE id = ?1 AND completed = 0";

    // Move into the done column → auto-complete
    conn.execute("UPDATE cards SET column_id = ?1 WHERE id = ?2", params![done_col, card_id]).unwrap();
    assert!(is_done(&conn, &done_col));
    conn.execute(auto_complete, params![card_id]).unwrap();
    let (completed, completed_at): (i64, Option<String>) = conn
        .query_row("SELECT completed, completed_at FROM cards WHERE id = ?1", params![card_id], |r| {
            Ok((r.get(0)?, r.get(1)?))
        })
        .unwrap();
    assert_eq!(completed, 1, "moving into done column must complete the card");
    let stamped = completed_at.expect("completed_at must be set");

    // Re-running the guarded update must NOT re-stamp completed_at.
    conn.execute(auto_complete, params![card_id]).unwrap();
    let after: Option<String> = conn
        .query_row("SELECT completed_at FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert_eq!(after, Some(stamped), "already-completed card keeps its original completed_at");

    // A non-done column must not trigger auto-complete.
    let card2 = insert_card(&conn, &todo_col, "Card 2", 1);
    assert!(!is_done(&conn, &todo_col));
    let completed2: i64 = conn
        .query_row("SELECT completed FROM cards WHERE id = ?1", params![card2], |r| r.get(0))
        .unwrap();
    assert_eq!(completed2, 0);
}

#[test]
fn test_batch_reorder_cards() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col_id = insert_column(&conn, &board_id, "Todo", "todo", 0);

    let c1 = insert_card(&conn, &col_id, "Card 1", 0);
    let c2 = insert_card(&conn, &col_id, "Card 2", 1);
    let c3 = insert_card(&conn, &col_id, "Card 3", 2);

    // Reorder: c3, c1, c2
    let new_order = vec![&c3, &c1, &c2];
    let tx = conn.unchecked_transaction().unwrap();
    for (i, card_id) in new_order.iter().enumerate() {
        tx.execute(
            "UPDATE cards SET sort_order = ?1 WHERE id = ?2",
            params![i as i64, card_id],
        )
        .unwrap();
    }
    tx.commit().unwrap();

    let mut stmt = conn
        .prepare("SELECT id FROM cards WHERE column_id = ?1 ORDER BY sort_order ASC")
        .unwrap();
    let ids: Vec<String> = stmt
        .query_map(params![col_id], |r| r.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();
    assert_eq!(ids, vec![c3, c1, c2]);
}

#[test]
fn test_subtask_crud_and_toggle() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col_id = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let card_id = insert_card(&conn, &col_id, "Card", 0);

    // Create subtask
    conn.execute(
        "INSERT INTO subtasks (card_id, title, sort_order) VALUES (?1, 'Sub 1', 0)",
        params![card_id],
    )
    .unwrap();
    let sub_id: String = conn
        .query_row(
            "SELECT id FROM subtasks WHERE rowid = last_insert_rowid()",
            [],
            |r| r.get(0),
        )
        .unwrap();

    // Toggle completed
    conn.execute("UPDATE subtasks SET completed = 1 WHERE id = ?1", params![sub_id])
        .unwrap();
    let completed: i64 = conn
        .query_row("SELECT completed FROM subtasks WHERE id = ?1", params![sub_id], |r| r.get(0))
        .unwrap();
    assert_eq!(completed, 1);

    // Cascade delete: deleting card should delete subtask
    conn.execute("DELETE FROM cards WHERE id = ?1", params![card_id]).unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM subtasks", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn test_card_attachments_cascade_and_cleanup_queries() {
    let conn = setup_db();
    let proj = insert_project(&conn, "P1");
    let board = insert_board(&conn, &proj, "B1");
    let col = insert_column(&conn, &board, "Todo", "todo", 0);
    let card = insert_card(&conn, &col, "Card", 0);

    let insert_att = |card_id: &str, name: &str, path: &str| {
        conn.execute(
            "INSERT INTO card_attachments (card_id, original_name, stored_path) VALUES (?1, ?2, ?3)",
            params![card_id, name, path],
        )
        .unwrap();
    };
    insert_att(&card, "a.png", "attachments/a.png");
    insert_att(&card, "b.pdf", "attachments/b.pdf");

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM card_attachments WHERE card_id = ?1", params![card], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 2);

    // The delete_board cleanup query must find both stored_paths via the JOIN.
    let mut stmt = conn
        .prepare(
            "SELECT a.stored_path FROM card_attachments a \
             JOIN cards c ON c.id = a.card_id \
             JOIN columns co ON co.id = c.column_id WHERE co.board_id = ?1",
        )
        .unwrap();
    let paths: Vec<String> = stmt
        .query_map(params![board], |r| r.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();
    assert_eq!(paths.len(), 2);
    assert!(paths.iter().all(|p| p.starts_with("attachments/")));

    // The delete_project cleanup query must also find them via the full JOIN chain.
    let proj_paths: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM card_attachments a \
             JOIN cards c ON c.id = a.card_id \
             JOIN columns co ON co.id = c.column_id \
             JOIN boards b ON b.id = co.board_id WHERE b.project_id = ?1",
            params![proj],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(proj_paths, 2);

    // FK cascade: deleting the project removes attachment rows.
    conn.execute("DELETE FROM projects WHERE id = ?1", params![proj]).unwrap();
    let remaining: i64 = conn
        .query_row("SELECT COUNT(*) FROM card_attachments", [], |r| r.get(0))
        .unwrap();
    assert_eq!(remaining, 0, "attachment rows must cascade-delete with the project");
}

#[test]
fn test_tags_and_card_tags() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col_id = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let card_id = insert_card(&conn, &col_id, "Card", 0);

    // Create tag
    conn.execute("INSERT INTO tags (name, color) VALUES ('bug', '#ef4444')", []).unwrap();
    let tag_id: String = conn
        .query_row("SELECT id FROM tags WHERE rowid = last_insert_rowid()", [], |r| r.get(0))
        .unwrap();

    // Link tag to card
    conn.execute(
        "INSERT INTO card_tags (card_id, tag_id) VALUES (?1, ?2)",
        params![card_id, tag_id],
    )
    .unwrap();

    // Verify
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM card_tags WHERE card_id = ?1",
            params![card_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(count, 1);

    // Remove tag
    conn.execute(
        "DELETE FROM card_tags WHERE card_id = ?1 AND tag_id = ?2",
        params![card_id, tag_id],
    )
    .unwrap();
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM card_tags WHERE card_id = ?1",
            params![card_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(count, 0);

    // Unique tag name constraint
    let result = conn.execute("INSERT INTO tags (name, color) VALUES ('bug', '#000')", []);
    assert!(result.is_err());
}

#[test]
fn test_fts5_search() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col_id = insert_column(&conn, &board_id, "Todo", "todo", 0);

    insert_card(&conn, &col_id, "Fix login bug", 0);
    insert_card(&conn, &col_id, "Add signup page", 1);
    insert_card(&conn, &col_id, "Update dashboard", 2);

    // Search for "login"
    let mut stmt = conn
        .prepare("SELECT title FROM cards_fts WHERE cards_fts MATCH 'login*'")
        .unwrap();
    let results: Vec<String> = stmt
        .query_map([], |r| r.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0], "Fix login bug");

    // Search for "a" prefix — should match "add" and "update" (via description_text or title)
    let mut stmt = conn
        .prepare("SELECT title FROM cards_fts WHERE cards_fts MATCH 'add*'")
        .unwrap();
    let results: Vec<String> = stmt
        .query_map([], |r| r.get(0))
        .unwrap()
        .collect::<Result<Vec<_>, _>>()
        .unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0], "Add signup page");
}

#[test]
fn test_dashboard_aggregation() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "Work");
    let board_id = insert_board(&conn, &proj_id, "Sprint 1");
    let todo_col = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let done_col = insert_column(&conn, &board_id, "Done", "done", 1);

    insert_card(&conn, &todo_col, "Task 1", 0);
    insert_card(&conn, &todo_col, "Task 2", 1);
    insert_card(&conn, &done_col, "Task 3", 0);

    // Set due date on task 1 (urgent)
    conn.execute(
        "UPDATE cards SET due_date = date('now', '+1 day') WHERE title = 'Task 1'",
        [],
    )
    .unwrap();

    // Aggregation query
    let row = conn
        .query_row(
            "SELECT
                COUNT(ca.id),
                SUM(CASE WHEN co.status_category = 'todo' THEN 1 ELSE 0 END),
                SUM(CASE WHEN co.status_category = 'done' THEN 1 ELSE 0 END),
                SUM(CASE WHEN ca.due_date IS NOT NULL AND ca.due_date <= date('now', '+7 days') AND co.status_category != 'done' THEN 1 ELSE 0 END)
             FROM cards ca
             JOIN columns co ON co.id = ca.column_id
             JOIN boards b ON b.id = co.board_id
             WHERE b.project_id = ?1",
            params![proj_id],
            |r| {
                Ok((
                    r.get::<_, i64>(0)?,
                    r.get::<_, i64>(1)?,
                    r.get::<_, i64>(2)?,
                    r.get::<_, i64>(3)?,
                ))
            },
        )
        .unwrap();

    assert_eq!(row.0, 3); // total cards
    assert_eq!(row.1, 2); // todo
    assert_eq!(row.2, 1); // done
    assert_eq!(row.3, 1); // urgent (due within 7 days, not done)
}

#[test]
fn test_unified_status_mapping() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let todo_col = insert_column(&conn, &board_id, "Backlog", "todo", 0);
    let prog_col = insert_column(&conn, &board_id, "Working", "in_progress", 1);

    let card_id = insert_card(&conn, &todo_col, "Feature X", 0);

    // Move card by status category: find first "in_progress" column in project
    let target_col: String = conn
        .query_row(
            "SELECT co.id FROM columns co
             JOIN boards b ON b.id = co.board_id
             WHERE b.project_id = ?1 AND co.status_category = 'in_progress'
             ORDER BY co.sort_order ASC LIMIT 1",
            params![proj_id],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(target_col, prog_col);

    conn.execute(
        "UPDATE cards SET column_id = ?1 WHERE id = ?2",
        params![target_col, card_id],
    )
    .unwrap();

    let new_col: String = conn
        .query_row("SELECT column_id FROM cards WHERE id = ?1", params![card_id], |r| r.get(0))
        .unwrap();
    assert_eq!(new_col, prog_col);
}

#[test]
fn test_cascade_delete_project() {
    let conn = setup_db();
    let proj_id = insert_project(&conn, "P1");
    let board_id = insert_board(&conn, &proj_id, "B1");
    let col_id = insert_column(&conn, &board_id, "Todo", "todo", 0);
    let card_id = insert_card(&conn, &col_id, "Card", 0);

    conn.execute(
        "INSERT INTO subtasks (card_id, title, sort_order) VALUES (?1, 'Sub', 0)",
        params![card_id],
    )
    .unwrap();

    // Delete project — everything cascades
    conn.execute("DELETE FROM projects WHERE id = ?1", params![proj_id]).unwrap();

    let boards: i64 = conn.query_row("SELECT COUNT(*) FROM boards", [], |r| r.get(0)).unwrap();
    let columns: i64 = conn.query_row("SELECT COUNT(*) FROM columns", [], |r| r.get(0)).unwrap();
    let cards: i64 = conn.query_row("SELECT COUNT(*) FROM cards", [], |r| r.get(0)).unwrap();
    let subtasks: i64 = conn.query_row("SELECT COUNT(*) FROM subtasks", [], |r| r.get(0)).unwrap();

    assert_eq!(boards, 0);
    assert_eq!(columns, 0);
    assert_eq!(cards, 0);
    assert_eq!(subtasks, 0);
}

#[test]
fn test_wal_mode() {
    // WAL mode only works with file-based DB, but we verify the pragma doesn't error
    let conn = Connection::open_in_memory().unwrap();
    let result = conn.execute_batch("PRAGMA journal_mode=WAL;");
    // In-memory DB may return 'memory' mode, but the pragma itself should not error
    assert!(result.is_ok());
}

#[test]
fn test_hex_randomblob_id_generation() {
    let conn = setup_db();
    let id1 = insert_project(&conn, "P1");
    let id2 = insert_project(&conn, "P2");

    // IDs should be 32-char hex strings
    assert_eq!(id1.len(), 32);
    assert_eq!(id2.len(), 32);
    // IDs should be unique
    assert_ne!(id1, id2);
    // IDs should be lowercase hex
    assert!(id1.chars().all(|c| c.is_ascii_hexdigit()));
}
