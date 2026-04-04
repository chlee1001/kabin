<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# ui

## Purpose
shadcn/ui component primitives built on Radix UI. These are low-level building blocks used by all feature components.

## Key Files

| File | Description |
|------|-------------|
| `badge.tsx` | Badge component with variant styles |
| `button.tsx` | Button with variants: default, destructive, outline, secondary, ghost, link |
| `card.tsx` | Card container with header, title, description, content, footer |
| `command.tsx` | Command palette component (cmdk wrapper) |
| `dialog.tsx` | Modal dialog (Radix Dialog) |
| `dropdown-menu.tsx` | Dropdown menu (Radix DropdownMenu) |
| `input.tsx` | Text input field |
| `label.tsx` | Form label |
| `popover.tsx` | Popover (Radix Popover) |
| `scroll-area.tsx` | Custom scroll area (Radix ScrollArea) |
| `select.tsx` | Select dropdown (Radix Select) |
| `separator.tsx` | Visual separator line |
| `table.tsx` | Table components (table, header, body, row, cell) |
| `tooltip.tsx` | Tooltip (Radix Tooltip) |

## For AI Agents

### Working In This Directory
- These are shadcn/ui components — prefer regenerating via `npx shadcn@latest add <component>` over hand-editing
- All components use `cn()` from `@/lib/utils` for class merging
- Styling uses Tailwind CSS with CSS variable references
- Components use `React.forwardRef` for ref forwarding

### Common Patterns
- Radix UI primitive → styled wrapper with Tailwind
- `cva` (class-variance-authority) for variant definitions
- `cn()` for conditional class composition

## Dependencies

### External
- `@radix-ui/*` primitives, `class-variance-authority`, `cmdk`

<!-- MANUAL: -->
