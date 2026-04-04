<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-04 | Updated: 2026-04-04 -->

# styles

## Purpose
Global CSS configuration including Tailwind theme, OKLCH color variables, and light/dark mode definitions.

## Key Files

| File | Description |
|------|-------------|
| `globals.css` | Tailwind imports, CSS custom properties in OKLCH color space for light/dark themes, base layer styles, accent color themes |

## For AI Agents

### Working In This Directory
- Colors use OKLCH color space (not hex/HSL) for perceptual uniformity
- Theme variables defined as CSS custom properties on `:root` and `.dark`
- Accent color variants are separate CSS classes
- Imported in `main.tsx` as global styles

### Common Patterns
- `--background`, `--foreground`, `--primary`, etc. as OKLCH values
- Tailwind references these via `bg-background`, `text-foreground`, etc.

## Dependencies

### External
- Tailwind CSS 4

<!-- MANUAL: -->
