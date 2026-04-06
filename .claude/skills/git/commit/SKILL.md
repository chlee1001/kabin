---
name: commit
description: Create git commit following project conventions. Use when staging changes and ready to commit.
---

# Git Commit Generator

Create a git commit following LFIN project conventions with Jira ticket prefix.

## Procedure

1. Run `git branch --show-current` to get current branch
2. Extract Jira ticket from branch name (e.g., `feature/LFDS-4_description` → `LFDS-4`)
3. Run `git status` and `git diff --staged` to analyze changes
4. Determine commit type and scope from changes
5. Generate commit message in Korean with ticket prefix
6. Execute `git commit` using HEREDOC format (see below)

## Commit Format

```
<TICKET>: <type>(<scope>): <subject>

<body>
```

**Examples**:
```
LFDS-4: feat(Radio): Radio 컴포넌트 래퍼 구현
LFDS-12: fix(Button): disabled 상태 스타일 수정
LFDS-7: refactor(hooks): useDebounce 타입 개선
```

## Ticket Extraction

| Branch Pattern | Ticket |
|----------------|--------|
| `feature/LFDS-4_Radio-재정의` | `LFDS-4` |
| `fix/LFDS-12_button-style` | `LFDS-12` |
| `develop` or `main` | _(omit prefix)_ |

Regex: `/([A-Z]+-\d+)/` from branch name

## Types

| Type | Use when |
|------|----------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Code restructure |
| `test` | Add/modify tests |
| `chore` | Build, config, deps |

## Constraints

- **Korean only** for message content
- **NO Claude signature** (🤖 Generated with Claude Code)
- **NO Co-Authored-By header**
- Subject: max 50 chars (excluding ticket prefix)
- Body: wrap at 72 chars
- Blank line between subject and body
- Body explains "what" and "why"
- One commit = one logical change
- **MUST use HEREDOC** for commit message to preserve newlines:

```bash
git commit -m "$(cat <<'EOF'
<subject line>

<body>
EOF
)"
```

> **WARNING**: Do NOT pass multi-line messages as a single string with `\n`.
> Some agents render `\n` as literal text instead of newlines.
