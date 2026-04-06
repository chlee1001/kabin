<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-06 | Updated: 2026-04-06 -->

# types

## Purpose
TypeScript type declarations and module augmentations.

## Key Files

| File | Description |
|------|-------------|
| `i18next.d.ts` | i18next module augmentation: typed `t()` function with namespace-aware key autocompletion |

## For AI Agents

### Working In This Directory
- `i18next.d.ts` imports translation JSON files to generate typed keys
- When adding a new translation namespace, update the `resources` type in `i18next.d.ts`
- Domain entity types (Project, Board, Card, etc.) live in `@/lib/tauri.ts`, not here

<!-- MANUAL: -->
