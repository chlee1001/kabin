<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-06 | Updated: 2026-04-06 -->

# locales

## Purpose
i18next translation files organized by namespace-per-feature. Supports Korean (ko) and English (en).

## Key Files

| File | Description |
|------|-------------|
| `en/common.json` | Shared UI strings: buttons, labels, confirmations |
| `en/board.json` | Board view translations: columns, DnD, backgrounds |
| `en/card.json` | Card detail translations: fields, tags, subtasks |
| `en/dashboard.json` | Dashboard translations: summaries, urgent items |
| `en/layout.json` | Layout translations: sidebar, topbar, command palette |
| `en/settings.json` | Settings translations: theme, accent, backup |
| `en/table.json` | Table view translations: filters, sorting |
| `ko/` | Korean translations (same 7 namespace files) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `en/` | English translations |
| `ko/` | Korean translations (default locale) |

## For AI Agents

### Working In This Directory
- Namespace-by-feature: each JSON file maps to a feature area
- Both `en/` and `ko/` must have identical key structures
- When adding a new translation key, add it to both locales
- Keys are referenced via `t('namespace:key')` in React components
- i18next is configured in `@/lib/i18n.ts`

### Common Patterns
- Flat key structure within each namespace (no deep nesting)
- Interpolation uses `{{variable}}` syntax
- Plurals use `_one` / `_other` suffixes

## Dependencies

### Internal
- `@/lib/i18n.ts` — i18next initialization and namespace loading

### External
- `i18next`, `react-i18next`

<!-- MANUAL: -->
