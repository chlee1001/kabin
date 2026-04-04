<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# board

## Purpose
Kanban board view components: board listing, board detail with columns, draggable cards, column management, background customization, and board cloning.

## Key Files

| File | Description |
|------|-------------|
| `board-detail-page.tsx` | Main board page: renders columns, handles column drag-and-drop reorder, sorting options, background picker, clone dialog |
| `board-column.tsx` | Single kanban column: displays cards with drag-and-drop, supports sorting (manual/due date/title/created) |
| `board-card.tsx` | Card component: draggable, shows completion checkbox, deadline badge, color indicator, move menu |
| `column-header.tsx` | Column header: name display, card count, add card button, rename/delete options |
| `card-move-menu.tsx` | Dropdown to move a card to other columns within the same board |
| `board-background-picker.tsx` | Picker for board background: gradient presets or image upload |
| `board-clone-dialog.tsx` | Dialog to duplicate a board with options to include/exclude cards |
| `project-boards-page.tsx` | Project overview: grid of boards with create board functionality |

## For AI Agents

### Working In This Directory
- This is the most complex feature area — board-detail-page.tsx is a hot path
- Drag-and-drop uses `@atlaskit/pragmatic-drag-and-drop` (not react-dnd)
- Cards are dragged between columns; columns are dragged to reorder
- Sorting is per-column and affects card display order
- Background images are saved via Tauri filesystem plugin

### Testing Requirements
- Verify drag-and-drop after changes (column reorder + card move)
- Test sorting modes don't break card positions
- Test board clone with and without cards

### Common Patterns
- `useBoardCards()` and `useColumns()` hooks for data
- `monitor` / `draggable` / `dropTargetForElements` from Pragmatic DnD
- Column status categories: todo, in_progress, done, other

## Dependencies

### Internal
- `@/hooks/use-boards`, `@/hooks/use-columns`, `@/hooks/use-cards`
- `@/components/shared/` — DeadlineBadge, EmptyState
- `@/components/card-detail/` — CardDetailModal triggered on card click

### External
- `@atlaskit/pragmatic-drag-and-drop`, Lucide icons

<!-- MANUAL: -->
