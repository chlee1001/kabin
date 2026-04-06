pub mod kanri;
pub mod trello;
pub mod writer;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ImportSource {
    Kanri,
    Trello,
}

#[derive(Debug, Serialize)]
pub struct ImportPreview {
    pub source: ImportSource,
    pub project_name: String,
    pub board_count: usize,
    pub column_count: usize,
    pub card_count: usize,
    pub tag_count: usize,
    pub subtask_count: usize,
}

/// Common intermediate representation for imported data
#[derive(Debug)]
pub struct ImportData {
    pub source: ImportSource,
    pub project_name: String,
    pub boards: Vec<ImportBoard>,
    pub tags: Vec<ImportTag>,
}

#[derive(Debug)]
pub struct ImportBoard {
    pub name: String,
    pub columns: Vec<ImportColumn>,
}

#[derive(Debug)]
pub struct ImportColumn {
    pub name: String,
    pub cards: Vec<ImportCard>,
}

#[derive(Debug)]
pub struct ImportCard {
    pub title: String,
    pub description: String, // already Tiptap JSON
    pub due_date: Option<String>,
    pub start_date: Option<String>,
    pub color: Option<String>,
    pub completed: bool,
    pub tags: Vec<String>, // tag names
    pub subtasks: Vec<ImportSubtask>,
}

#[derive(Debug)]
pub struct ImportSubtask {
    pub title: String,
    pub completed: bool,
}

#[derive(Debug)]
pub struct ImportTag {
    pub name: String,
    pub color: String,
}

impl ImportData {
    pub fn preview(&self) -> ImportPreview {
        let column_count: usize = self.boards.iter().map(|b| b.columns.len()).sum();
        let card_count: usize = self
            .boards
            .iter()
            .flat_map(|b| &b.columns)
            .map(|c| c.cards.len())
            .sum();
        let subtask_count: usize = self
            .boards
            .iter()
            .flat_map(|b| &b.columns)
            .flat_map(|c| &c.cards)
            .map(|card| card.subtasks.len())
            .sum();
        ImportPreview {
            source: self.source.clone(),
            project_name: self.project_name.clone(),
            board_count: self.boards.len(),
            column_count,
            card_count,
            tag_count: self.tags.len(),
            subtask_count,
        }
    }
}

/// Wrap plain text into minimal Tiptap JSON document
pub fn text_to_tiptap(text: &str) -> String {
    if text.is_empty() {
        return "{}".to_string();
    }
    let paragraphs: Vec<serde_json::Value> = text
        .lines()
        .map(|line| {
            if line.is_empty() {
                serde_json::json!({ "type": "paragraph" })
            } else {
                serde_json::json!({
                    "type": "paragraph",
                    "content": [{ "type": "text", "text": line }]
                })
            }
        })
        .collect();
    serde_json::json!({
        "type": "doc",
        "content": paragraphs
    })
    .to_string()
}
