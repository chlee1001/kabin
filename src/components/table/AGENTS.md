<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# table

## Purpose
Table view for browsing all cards across projects with filtering and sorting capabilities.

## Key Files

| File | Description |
|------|-------------|
| `table-view-page.tsx` | Filterable/sortable table: project, title, status, dates, subtask progress columns |
| `filter-bar.tsx` | Multi-filter UI: project filter, status categories, tags, date ranges with visual badge counts |

## For AI Agents

### Working In This Directory
- Table uses TanStack Table for column definitions and sorting
- Data comes from `useUnified()` hook (cross-board card query)
- FilterBar state is local to the page component

### Common Patterns
- TanStack Table column definitions with custom cell renderers
- Filter state managed as component state, applied to query params

## Dependencies

### Internal
- `@/hooks/use-unified`, `@/hooks/use-projects`, `@/hooks/use-tags`
- `@/components/shared/deadline-badge`

### External
- `@tanstack/react-table`

<!-- MANUAL: -->
