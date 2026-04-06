<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-06 -->

# hooks

## Purpose
Custom React hooks that wrap TanStack React Query operations for all Tauri backend calls. Each hook provides queries and mutations for a specific domain entity.

## Key Files

| File | Description |
|------|-------------|
| `use-projects.ts` | CRUD for projects with optimistic updates |
| `use-boards.ts` | CRUD for boards (list, get, create, update, delete, clone) |
| `use-columns.ts` | CRUD for columns with reorder support |
| `use-cards.ts` | CRUD for cards with move and reorder operations |
| `use-subtasks.ts` | CRUD for subtasks with reorder support |
| `use-tags.ts` | CRUD for tags and card-tag associations |
| `use-dashboard.ts` | Fetches project summaries and urgent cards |
| `use-unified.ts` | Fetches filtered cards across all boards by status category |
| `use-backup.ts` | Backup operations (create, get last backup time) |
| `use-keyboard.ts` | Global keyboard shortcuts (Cmd+\ sidebar, Cmd+S backup, Cmd+N new card, Cmd+, settings) |
| `use-templates.ts` | CRUD for card templates: list, create, update, delete, create card from template |

## For AI Agents

### Working In This Directory
- Every hook uses React Query's `useQuery` / `useMutation` pattern
- API calls go through `@/lib/tauri.ts` (e.g., `cardApi.getCards()`)
- Mutations invalidate related query keys after success
- Query keys follow the pattern `['entity']` or `['entity', id]`

### Common Patterns
- `useQuery` for reads, `useMutation` for writes
- `queryClient.invalidateQueries` after mutations
- Optimistic updates in some mutations (projects)
- Hooks return React Query result objects directly

## Dependencies

### Internal
- `@/lib/tauri.ts` — typed Tauri API bridge

### External
- `@tanstack/react-query`

<!-- MANUAL: -->
