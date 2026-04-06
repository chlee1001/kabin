use super::{
    text_to_tiptap, ImportBoard, ImportCard, ImportColumn, ImportData, ImportSource, ImportSubtask,
    ImportTag,
};
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
struct TrelloExport {
    name: String,
    lists: Vec<TrelloList>,
    cards: Vec<TrelloCard>,
    #[serde(default)]
    checklists: Vec<TrelloChecklist>,
    #[serde(default)]
    labels: Vec<TrelloLabel>,
}

#[derive(Deserialize)]
struct TrelloList {
    id: String,
    name: String,
    #[serde(default)]
    closed: bool,
}

#[derive(Deserialize)]
struct TrelloCard {
    id: String,
    name: String,
    #[serde(default)]
    desc: String,
    #[serde(rename = "idList")]
    id_list: String,
    #[serde(default)]
    due: Option<String>,
    #[serde(default)]
    closed: bool,
    #[serde(rename = "dueComplete", default)]
    due_complete: bool,
    #[allow(dead_code)]
    #[serde(rename = "idChecklists", default)]
    id_checklists: Vec<String>,
    #[serde(default)]
    labels: Vec<TrelloCardLabel>,
}

#[derive(Deserialize)]
struct TrelloCardLabel {
    #[serde(default)]
    name: String,
    #[serde(default)]
    color: Option<String>,
}

#[derive(Deserialize)]
struct TrelloLabel {
    #[serde(default)]
    name: String,
    #[serde(default)]
    color: Option<String>,
}

#[derive(Deserialize)]
struct TrelloChecklist {
    #[allow(dead_code)]
    id: String,
    #[serde(rename = "idCard")]
    id_card: String,
    #[serde(rename = "checkItems", default)]
    check_items: Vec<TrelloCheckItem>,
}

#[derive(Deserialize)]
struct TrelloCheckItem {
    name: String,
    #[serde(default)]
    state: String, // "complete" or "incomplete"
}

fn trello_color_to_hex(color: &str) -> String {
    match color {
        "red" => "#ef4444".to_string(),
        "orange" => "#f97316".to_string(),
        "yellow" => "#eab308".to_string(),
        "green" => "#22c55e".to_string(),
        "blue" => "#3b82f6".to_string(),
        "purple" => "#a855f7".to_string(),
        "pink" => "#ec4899".to_string(),
        "sky" => "#0ea5e9".to_string(),
        "lime" => "#84cc16".to_string(),
        "black" => "#1e293b".to_string(),
        _ => "#6b7280".to_string(),
    }
}

pub fn parse(json_str: &str) -> Result<ImportData, String> {
    let export: TrelloExport =
        serde_json::from_str(json_str).map_err(|e| format!("Invalid Trello export: {}", e))?;

    // Validate structure
    if export.lists.is_empty() {
        return Err("Invalid Trello export: no lists found".to_string());
    }

    // Build checklist lookup: card_id -> Vec<subtasks>
    let mut checklist_map: HashMap<String, Vec<ImportSubtask>> = HashMap::new();
    for cl in &export.checklists {
        let subtasks: Vec<ImportSubtask> = cl
            .check_items
            .iter()
            .map(|item| ImportSubtask {
                title: item.name.clone(),
                completed: item.state == "complete",
            })
            .collect();
        checklist_map
            .entry(cl.id_card.clone())
            .or_default()
            .extend(subtasks);
    }

    // Build cards grouped by list_id (skip closed cards)
    let mut cards_by_list: HashMap<String, Vec<ImportCard>> = HashMap::new();
    for card in &export.cards {
        if card.closed {
            continue;
        }
        let tag_names: Vec<String> = card
            .labels
            .iter()
            .map(|l| {
                if l.name.is_empty() {
                    l.color.as_deref().unwrap_or("unlabeled").to_string()
                } else {
                    l.name.clone()
                }
            })
            .collect();

        let subtasks = checklist_map.remove(&card.id).unwrap_or_default();

        let import_card = ImportCard {
            title: card.name.clone(),
            description: text_to_tiptap(&card.desc),
            due_date: card.due.clone(),
            start_date: None,
            color: None,
            completed: card.due_complete,
            tags: tag_names,
            subtasks,
        };
        cards_by_list
            .entry(card.id_list.clone())
            .or_default()
            .push(import_card);
    }

    // Collect tags from top-level labels (skip empty names)
    let tags: Vec<ImportTag> = export
        .labels
        .iter()
        .filter(|l| !l.name.is_empty())
        .map(|l| ImportTag {
            name: l.name.clone(),
            color: l
                .color
                .as_deref()
                .map(trello_color_to_hex)
                .unwrap_or_else(|| "#6b7280".to_string()),
        })
        .collect();

    // Build columns from open lists
    let columns: Vec<ImportColumn> = export
        .lists
        .iter()
        .filter(|l| !l.closed)
        .map(|list| {
            let cards = cards_by_list.remove(&list.id).unwrap_or_default();
            ImportColumn {
                name: list.name.clone(),
                cards,
            }
        })
        .collect();

    let board_name = export.name.clone();

    Ok(ImportData {
        source: ImportSource::Trello,
        project_name: export.name,
        boards: vec![ImportBoard {
            name: board_name,
            columns,
        }],
        tags,
    })
}
