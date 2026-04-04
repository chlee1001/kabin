<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# src

## Purpose
React frontend source code for the Kanban application. Contains all UI components, hooks for data fetching, state management, utility libraries, and styling.

## Key Files

| File | Description |
|------|-------------|
| `main.tsx` | App entry point, renders root React component |
| `App.tsx` | Root component wiring Router, QueryClient, ThemeProvider, CommandPalette, and CardDetailModal |
| `vite-env.d.ts` | Vite client type definitions |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `components/` | All React components organized by feature (see `components/AGENTS.md`) |
| `hooks/` | Custom React hooks wrapping Tauri API calls via React Query (see `hooks/AGENTS.md`) |
| `lib/` | Utility functions and the Tauri API bridge (see `lib/AGENTS.md`) |
| `stores/` | Zustand client-side state stores (see `stores/AGENTS.md`) |
| `styles/` | Global CSS and Tailwind theme configuration (see `styles/AGENTS.md`) |
| `pages/` | Empty — routing is handled via TanStack Router in App.tsx |

## For AI Agents

### Working In This Directory
- Import paths use `@/` alias (e.g., `@/components/ui/button`)
- React 19 with functional components only
- Data fetching happens in `hooks/` via React Query, never directly in components
- All Tauri IPC calls go through `lib/tauri.ts`
- Theme uses OKLCH color space with CSS variables defined in `styles/globals.css`

### Common Patterns
- Components receive data via props or React Query hooks
- Mutations use optimistic updates with query invalidation
- UI primitives come from `components/ui/` (shadcn/ui)

## Dependencies

### Internal
- `src-tauri/` — backend commands invoked via Tauri IPC

### External
- React 19, TanStack ecosystem, Zustand, Tiptap, Pragmatic DnD, Radix UI

<!-- MANUAL: -->
