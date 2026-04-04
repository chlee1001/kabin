<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# shared

## Purpose
Reusable components used across multiple feature areas: modal prompt system, empty states, and deadline badges.

## Key Files

| File | Description |
|------|-------------|
| `prompt-dialog.tsx` | Context provider for modal prompts/confirmations: exposes `usePrompt()` and `useConfirm()` hooks |
| `empty-state.tsx` | Reusable empty state: icon, title, description, optional action button |
| `deadline-badge.tsx` | Badge showing deadline status: Overdue (red), Today (orange), Tomorrow (yellow), Xd (gray) |

## For AI Agents

### Working In This Directory
- `prompt-dialog.tsx` provides a context-based prompt system used throughout the app for confirmations
- `deadline-badge.tsx` is used in board cards, urgent lists, and table view
- These are leaf components with no complex state — keep them simple

### Common Patterns
- Context-based hooks for dialogs (avoids prop drilling)
- Color coding via deadline proximity constants from `@/lib/constants`

## Dependencies

### Internal
- `@/lib/constants` — deadline color thresholds
- `@/components/ui/` — Dialog, Button

<!-- MANUAL: -->
