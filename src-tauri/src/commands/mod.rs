use serde::Deserialize;

/// serde helper for nullable update fields.
///
/// Maps an outer `Option` so the three JSON states are distinguishable:
/// - field absent      → `None`        (leave column untouched)
/// - field present null → `Some(None)` (set column to SQL NULL)
/// - field present val  → `Some(Some)` (set column to value)
///
/// Without this, serde's default consumes JSON `null` into the outer `None`,
/// making "clear this field" indistinguishable from "don't touch this field".
/// Apply together with `#[serde(default)]` to keep absent fields as `None`.
pub fn deserialize_optional_nullable<'de, D>(
    deserializer: D,
) -> Result<Option<Option<String>>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Ok(Some(Option::deserialize(deserializer)?))
}

pub mod projects;
pub mod boards;
pub mod columns;
pub mod cards;
pub mod subtasks;
pub mod tags;
pub mod dashboard;
pub mod unified;
pub mod search;
pub mod backup;
pub mod settings;
pub mod templates;
pub mod import;
pub mod attachments;
