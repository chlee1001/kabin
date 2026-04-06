---
name: git
description: Route git-related workflows to the right child skill. Use when you need an overview of the git skill family or need help choosing between commit, create-pr, and summarize-pr.
---

# Git Skill Set

Use this meta-skill as the catalog/router for git-related workflows in this repository.

## Use this skill when

- you need help choosing the right git workflow
- you want an overview of the `git/` skill family before invoking a child skill
- you want bundle-level guidance without coupling child skills to parent-only runtime references

## Child skills

### `commit`
- Path: `git/commit/SKILL.md`
- Use when staged changes are ready and you need a repository-convention commit message.

### `create-pr`
- Path: `git/create-pr/SKILL.md`
- Use when the current branch should be updated from `develop`, pushed, and turned into a pull request.

### `summarize-pr`
- Path: `git/summarize-pr/SKILL.md`
- Use when a `develop` → `main` merge PR needs a structured release summary.

## Selection guide

| Goal | Use |
|------|-----|
| Create a commit message for staged changes | `commit` |
| Push a branch and create/update a PR to `develop` | `create-pr` |
| Summarize a merge PR from `develop` to `main` | `summarize-pr` |

## Architecture note

- `git/` is the set/catalog layer for this skill family.
- Each child skill remains standalone and self-contained.
- This project uses **GitHub** exclusively via `gh` CLI.
