<!-- Generated: 2026-04-04 | Updated: 2026-04-06 -->

# kanban

## Purpose
A desktop Kanban board application built with Tauri 2 (Rust backend) and React 19 (TypeScript frontend). Provides project/board/card management with drag-and-drop, rich text editing, full-text search, and local SQLite persistence.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Frontend dependencies and dev scripts |
| `vite.config.ts` | Vite build config (dev server port 1420) |
| `tsconfig.json` | TypeScript project references config |
| `tsconfig.app.json` | TypeScript app compilation config with `@/*` path alias |
| `components.json` | shadcn/ui component configuration |
| `index.html` | HTML entry point (ko locale) |
| `.npmrc` | npm configuration |
| `.gitignore` | Git ignore rules |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | React frontend source code (see `src/AGENTS.md`) |
| `src-tauri/` | Tauri/Rust backend source code (see `src-tauri/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- This is a Tauri 2 + React 19 + TypeScript 5.7 project
- Frontend dev server: `npm run dev` (port 1420)
- Tauri dev: `npm run tauri dev`
- Path alias: `@/*` maps to `./src/*`
- UI components use shadcn/ui with Radix primitives
- State: Zustand (client) + TanStack React Query (server)
- Routing: TanStack Router
- Drag-and-drop: Atlassian Pragmatic DnD
- Rich text: Tiptap editor
- Colors use OKLCH color space

### Data Model
Projects → Boards → Columns → Cards → Subtasks, with Tags as a cross-cutting entity.

### Testing Requirements
- Rust integration tests in `src-tauri/tests/`
- Run `cargo test` from `src-tauri/` for backend tests

### Common Patterns
- Tauri commands are the API layer between frontend and backend
- Frontend hooks in `src/hooks/` wrap React Query mutations/queries calling `src/lib/tauri.ts`
- `src/lib/tauri.ts` is the typed API bridge invoking Tauri commands

## Dependencies

### External (Frontend)
- React 19, TanStack (Router, Query, Table, Virtual), Zustand, Tiptap, Pragmatic DnD, Radix UI, Tailwind CSS 4, Vite 6

### External (Backend)
- Tauri 2, rusqlite (bundled SQLite), serde, chrono

<!-- MANUAL: -->
