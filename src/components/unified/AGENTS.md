<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# unified

## Purpose
Cross-board kanban view that aggregates cards from all projects, grouped by status category (Todo, In Progress, Done).

## Key Files

| File | Description |
|------|-------------|
| `unified-kanban-page.tsx` | Unified kanban: cards grouped by status category across all boards, virtual scrolling, drag-and-drop between status lanes, project color indicators |

## For AI Agents

### Working In This Directory
- Uses `useUnified()` hook for cross-project card data
- Virtual scrolling via `@tanstack/react-virtual` for performance with large card counts
- Drag-and-drop moves cards between status categories (triggers `move_card_by_status_category` command)
- Each card shows its source project with color indicator

### Common Patterns
- Status categories (todo, in_progress, done) as column lanes
- Virtualized lists for each lane

## Dependencies

### Internal
- `@/hooks/use-unified`
- `@/components/shared/deadline-badge`

### External
- `@tanstack/react-virtual`, `@atlaskit/pragmatic-drag-and-drop`

<!-- MANUAL: -->
