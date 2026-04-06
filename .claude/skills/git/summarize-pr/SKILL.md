---
name: summarize-pr
description: Summarize develop→main merge PR and update PR body. Use when merging develop into main.
---

# PR Summary Generator

Summarize develop→main merge PR and update PR body.

**Usage**: `/summarize-pr <PR_NUMBER>`

This project uses GitHub exclusively via `gh` CLI.

## Steps

### 1. Fetch PR info

- Parse owner/repo from git remote

- `gh pr view <PR_NUMBER> --json title,body,commits`

### 2. Extract included feature PRs

- Extract `Merge pull request #XX` patterns from commit messages
- Fetch each feature PR for title, body, and changed files

- `gh pr view <NUMBER> --json title,body,files`

### 3. Generate summary

Compose using the template below:

```markdown
## Summary
- {feature summary} (#PR)
- `@l-fin/ui-components` X.X.X release (if applicable)

---

## Included Work

### {type}({scope}): {title} (#PR)

**Changes**:
- {change 1}
- {change 2}

**Behavior** (if applicable):
- {description}

---

## Changed Files

| File | Changes |
|------|---------|
| `{path}` | +{add} -{del} |
```

### 4. Update PR body

- `gh pr edit <PR_NUMBER> --body "..."`

**On success:**
```
✅ PR #<PR_NUMBER> 본문이 업데이트되었습니다!
```

## Rules

- Output in **Korean**
- Reuse feature PR body content
- Include version info if release commit exists
- Exclude non-significant files (lock files, etc.) from Changed Files
