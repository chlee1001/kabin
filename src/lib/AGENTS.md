<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-06 -->

# lib

## Purpose
Utility functions and the typed Tauri API bridge. This is the critical interface layer between the React frontend and the Rust backend.

## Key Files

| File | Description |
|------|-------------|
| `tauri.ts` | Typed API bridge: defines all TypeScript interfaces (Project, Board, Column, Card, Subtask, Tag) and API namespaces (projectApi, boardApi, columnApi, cardApi, subtaskApi, tagApi, settingsApi) that invoke Tauri commands |
| `color-utils.ts` | Color conversion: hex↔OKLCH, contrast foreground calculation |
| `constants.ts` | Status categories, deadline color thresholds, default project colors, board background presets |
| `i18n.ts` | i18next initialization: language detection, namespace-by-feature loading, ko/en locales |
| `utils.ts` | `cn()` helper for merging Tailwind classes via clsx + tailwind-merge |

## For AI Agents

### Working In This Directory
- `tauri.ts` is the single source of truth for frontend-backend API contracts
- When adding a new Tauri command, add the corresponding typed function here
- TypeScript interfaces in `tauri.ts` must match Rust struct definitions in `src-tauri/src/commands/`
- `constants.ts` contains status category definitions used across the app

### Common Patterns
- API functions use `invoke<T>('command_name', { args })` from `@tauri-apps/api/core`
- Each entity has its own API namespace object (e.g., `cardApi.getCards(boardId)`)

## Dependencies

### External
- `@tauri-apps/api` — Tauri IPC invoke
- `clsx`, `tailwind-merge` — class utilities

<!-- MANUAL: -->
