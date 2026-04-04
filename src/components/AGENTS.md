<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# components

## Purpose
All React components organized by feature domain. Contains UI primitives (shadcn/ui), feature-specific components (board, cards, dashboard), layout shells, and shared utilities.

## Key Files

| File | Description |
|------|-------------|
| `theme-provider.tsx` | Theme context provider (light/dark/system) with accent color and Tauri settings sync |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `board/` | Kanban board view: columns, cards, drag-and-drop, backgrounds (see `board/AGENTS.md`) |
| `card-detail/` | Card editing modal: rich text, dates, colors, tags, subtasks (see `card-detail/AGENTS.md`) |
| `dashboard/` | Dashboard overview: project summaries, urgent cards (see `dashboard/AGENTS.md`) |
| `layout/` | App shell: sidebar, topbar, command palette (see `layout/AGENTS.md`) |
| `settings/` | Settings page: theme, accent color, backups, shortcuts (see `settings/AGENTS.md`) |
| `shared/` | Reusable components: prompt dialogs, empty states, badges (see `shared/AGENTS.md`) |
| `table/` | Table view: filterable/sortable card list across projects (see `table/AGENTS.md`) |
| `ui/` | shadcn/ui primitives: button, dialog, input, etc. (see `ui/AGENTS.md`) |
| `unified/` | Cross-board kanban: cards grouped by status category (see `unified/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Each subdirectory is a feature domain with self-contained components
- UI primitives in `ui/` are shadcn/ui wrappers — regenerate via CLI, don't hand-edit
- `theme-provider.tsx` is a root-level provider used in App.tsx
- Components consume hooks from `@/hooks/` for data, never call Tauri directly

### Common Patterns
- Functional components with TypeScript interfaces for props
- Tailwind CSS for styling with `cn()` utility from `@/lib/utils`
- Radix UI primitives wrapped by shadcn/ui in `ui/`
- Toast notifications via Sonner

## Dependencies

### Internal
- `@/hooks/` — data fetching hooks
- `@/lib/` — utilities and Tauri API bridge
- `@/stores/` — Zustand app state

### External
- Radix UI, Lucide React icons, clsx, Sonner

<!-- MANUAL: -->
