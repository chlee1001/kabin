<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# stores

## Purpose
Zustand stores for client-side UI state that doesn't belong in React Query's server state cache.

## Key Files

| File | Description |
|------|-------------|
| `app-store.ts` | Global app state: sidebar open/collapsed, selected project ID, selected board ID, with toggle/set actions |

## For AI Agents

### Working In This Directory
- Zustand stores hold UI-only state (sidebar, selections)
- Server data (projects, boards, cards) lives in React Query, not here
- Access stores via `useAppStore()` hook with selectors

### Common Patterns
- `create<StateType>()((set) => ({ ...state, ...actions }))` pattern
- Immutable state updates via spread operator in `set()`

## Dependencies

### External
- `zustand`

<!-- MANUAL: -->
