<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# card-detail

## Purpose
Card editing modal and its sub-components: rich text description editor, date pickers, color picker, tag management, subtask list, and cross-board move picker.

## Key Files

| File | Description |
|------|-------------|
| `card-detail-modal.tsx` | Full card editor modal: title, description, subtasks, dates, color, tags, move, delete |
| `rich-text-editor.tsx` | Tiptap editor with toolbar: bold, italic, strikethrough, lists, quotes, task lists, code blocks, undo/redo |
| `date-picker.tsx` | Date input with clear button for start/due dates |
| `color-picker.tsx` | Color selector: 9 presets + custom hex picker |
| `tag-picker.tsx` | Tag manager: applied tags, available tags, create new tags |
| `move-card-picker.tsx` | Cascading selectors to move card across projects/boards/columns |
| `subtask-list.tsx` | Subtask display: progress bar, checkbox toggle, add/delete |

## For AI Agents

### Working In This Directory
- CardDetailModal is rendered globally in App.tsx as an overlay
- Rich text is stored as Tiptap JSON, not HTML
- The modal auto-saves on changes (no explicit save button)
- Move picker loads projects/boards/columns dynamically

### Testing Requirements
- Verify rich text editor renders and saves correctly
- Test subtask reordering and progress calculation
- Test move-card across different projects

### Common Patterns
- Each sub-component is a controlled section within the modal
- Hooks: `useCards`, `useSubtasks`, `useTags` for data mutations

## Dependencies

### Internal
- `@/hooks/use-cards`, `@/hooks/use-subtasks`, `@/hooks/use-tags`
- `@/components/ui/` — Dialog, Button, Input, etc.

### External
- `@tiptap/react`, `@tiptap/starter-kit`, Lucide icons

<!-- MANUAL: -->
