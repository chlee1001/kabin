<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# dashboard

## Purpose
Dashboard overview page showing project health summaries and urgent cards requiring attention.

## Key Files

| File | Description |
|------|-------------|
| `dashboard-page.tsx` | Main dashboard: project summary cards, urgent card list, create project button |
| `project-summary-card.tsx` | Project card: total cards count, status breakdown progress bar, urgent count |
| `urgent-list.tsx` | List of cards with upcoming/overdue deadlines: project name, status, deadline badge |

## For AI Agents

### Working In This Directory
- Dashboard data comes from `useDashboard()` hook (aggregated backend query)
- Project summary shows card distribution across status categories
- Urgent cards are sorted by deadline proximity

### Common Patterns
- Read-only display components consuming `useDashboard()` hook data

## Dependencies

### Internal
- `@/hooks/use-dashboard`, `@/hooks/use-projects`
- `@/components/shared/deadline-badge`

<!-- MANUAL: -->
