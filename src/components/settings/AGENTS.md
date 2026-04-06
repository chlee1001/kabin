<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-06 -->

# settings

## Purpose
Application settings page for theme configuration, accent color selection, backup management, and keyboard shortcut reference.

## Key Files

| File | Description |
|------|-------------|
| `settings-page.tsx` | Settings UI: theme selector (light/dark/system), accent color picker (8 presets + custom), backup controls, keyboard shortcuts display |
| `tag-manager.tsx` | Tag CRUD management: create, rename, delete tags with color selection |

## For AI Agents

### Working In This Directory
- Settings are persisted via Tauri `settingsApi` (key-value store in SQLite)
- Theme changes go through the ThemeProvider context
- Accent colors update CSS custom properties at runtime

## Dependencies

### Internal
- `@/components/theme-provider` — theme context
- `@/hooks/use-backup`
- `@/lib/tauri` — settingsApi

<!-- MANUAL: -->
