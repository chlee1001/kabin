use super::{
    text_to_tiptap, ImportBoard, ImportCard, ImportColumn, ImportData, ImportSource, ImportSubtask,
    ImportTag,
};
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
struct KanriFullExport {
    boards: Vec<KanriBoard>,
}

#[derive(Deserialize)]
struct KanriBoard {
    title: String,
    columns: Vec<KanriColumn>,
    #[serde(rename = "globalTags", default)]
    global_tags: Vec<KanriTag>,
}

#[derive(Deserialize)]
struct KanriColumn {
    title: String,
    cards: Vec<KanriCard>,
}

#[derive(Deserialize)]
struct KanriCard {
    name: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    color: Option<String>,
    #[serde(rename = "dueDate", default)]
    due_date: Option<String>,
    #[serde(rename = "isDueDateCompleted", default)]
    is_due_date_completed: bool,
    #[serde(default)]
    tags: Vec<KanriTag>,
    #[serde(default)]
    tasks: Vec<KanriTask>,
}

#[derive(Deserialize, Clone)]
struct KanriTag {
    #[serde(alias = "text")]
    name: Option<String>,
    #[serde(default)]
    color: Option<String>,
}

#[derive(Deserialize)]
struct KanriTask {
    name: String,
    #[serde(default)]
    finished: bool,
}

pub fn parse(json_str: &str) -> Result<ImportData, String> {
    // Try full export first (has "boards" array)
    if let Ok(full) = serde_json::from_str::<KanriFullExport>(json_str) {
        if !full.boards.is_empty() {
            return convert_boards(full.boards);
        }
    }

    // Try single board
    if let Ok(board) = serde_json::from_str::<KanriBoard>(json_str) {
        return convert_boards(vec![board]);
    }

    Err("Invalid Kanri export: expected a board object with 'title' and 'columns', or a full export with 'boards' array".to_string())
}

fn convert_boards(kanri_boards: Vec<KanriBoard>) -> Result<ImportData, String> {
    let project_name = if kanri_boards.len() == 1 {
        kanri_boards[0].title.clone()
    } else {
        "Kanri Import".to_string()
    };

    // Collect all unique tags
    let mut tag_map: HashMap<String, String> = HashMap::new();
    for board in &kanri_boards {
        for tag in &board.global_tags {
            if let Some(name) = &tag.name {
                if !name.is_empty() {
                    tag_map
                        .entry(name.clone())
                        .or_insert_with(|| tag.color.clone().unwrap_or_else(|| "#94a3b8".to_string()));
                }
            }
        }
        for col in &board.columns {
            for card in &col.cards {
                for tag in &card.tags {
                    if let Some(name) = &tag.name {
                        if !name.is_empty() {
                            tag_map.entry(name.clone()).or_insert_with(|| {
                                tag.color.clone().unwrap_or_else(|| "#94a3b8".to_string())
                            });
                        }
                    }
                }
            }
        }
    }

    let tags: Vec<ImportTag> = tag_map
        .into_iter()
        .map(|(name, color)| ImportTag { name, color })
        .collect();

    let boards: Vec<ImportBoard> = kanri_boards
        .into_iter()
        .map(|board| {
            let columns = board
                .columns
                .into_iter()
                .map(|col| {
                    let cards = col
                        .cards
                        .into_iter()
                        .map(|card| {
                            let tag_names: Vec<String> = card
                                .tags
                                .iter()
                                .filter_map(|t| t.name.clone())
                                .filter(|n| !n.is_empty())
                                .collect();
                            ImportCard {
                                title: card.name,
                                description: text_to_tiptap(&card.description),
                                due_date: card.due_date,
                                start_date: None,
                                color: card.color,
                                completed: card.is_due_date_completed,
                                tags: tag_names,
                                subtasks: card
                                    .tasks
                                    .into_iter()
                                    .map(|t| ImportSubtask {
                                        title: t.name,
                                        completed: t.finished,
                                    })
                                    .collect(),
                            }
                        })
                        .collect();
                    ImportColumn {
                        name: col.title,
                        cards,
                    }
                })
                .collect();
            ImportBoard {
                name: board.title,
                columns,
            }
        })
        .collect();

    Ok(ImportData {
        source: ImportSource::Kanri,
        project_name,
        boards,
        tags,
    })
}
