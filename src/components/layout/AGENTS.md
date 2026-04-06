<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-06 -->

# layout

## Purpose
Application shell components: main layout wrapper, sidebar navigation, top bar, and global command palette search.

## Key Files

| File | Description |
|------|-------------|
| `app-layout.tsx` | Main layout: sidebar + topbar + content area, manages sidebar open/collapsed state |
| `sidebar.tsx` | Navigation: Dashboard/Unified/Table routes, projects list with expandable boards, collapsible |
| `topbar.tsx` | Header: sidebar toggle, search (Cmd+K), theme toggle, backup status, settings link |
| `command-palette.tsx` | Global search dialog (Cmd+K): uses Tauri `global_search` with project/board/column breadcrumbs |
| `keyboard-shortcuts-dialog.tsx` | Reference dialog listing all keyboard shortcuts grouped by category |

## For AI Agents

### Working In This Directory
- AppLayout wraps all routed pages
- Sidebar state (open/collapsed) is in Zustand `useAppStore()`
- Command palette uses `cmdk` library and Tauri's FTS5 search backend
- Keyboard shortcut Cmd+K opens command palette

### Common Patterns
- TanStack Router `<Link>` for navigation
- Sidebar shows project → board hierarchy

## Dependencies

### Internal
- `@/stores/app-store` — sidebar state
- `@/hooks/use-projects`, `@/hooks/use-boards`
- `@/lib/tauri` — `globalSearch()` for command palette

### External
- `cmdk`, Lucide icons

<!-- MANUAL: -->
