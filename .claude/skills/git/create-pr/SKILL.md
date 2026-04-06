---
name: create-pr
description: Prepare and create PR to develop branch. Use when pushing changes and creating a pull request.
---

# Create Pull Request

Prepare and create PR to develop branch.

## Pre-check

- If current branch is `develop` or `main`, warn and **STOP**
- This project uses GitHub exclusively via `gh` CLI

## Steps

### 1. Update develop & merge into current branch

```bash
CURRENT_BRANCH=$(git branch --show-current)
git fetch origin develop
git merge origin/develop --no-edit
```

- On conflict:
  ```
  ❌ develop 브랜치 머지 중 충돌이 발생했습니다.
  수동으로 충돌을 해결해주세요:

  1. 충돌 파일 확인: git status
  2. 충돌 해결 후: git add .
  3. 머지 완료: git commit
  4. 다시 실행: /create-pr
  ```

### 2. Push

```bash
git push origin HEAD
```

- On failure, print error and **STOP**

### 3. Create PR

#### 3-1. Generate PR title and body

Analyze commit history and diff, then compose in this format:

**Title**: `<TICKET>: <type>(<scope>): <subject>`

**Body**:
~~~markdown
## Summary
변경의 목적과 배경을 1-3문장으로 설명.

## Changes

### 카테고리 1 (예: 파일 구조 변경)
- `path/before/` → `path/after/`
- 구체적인 변경 내용

### 카테고리 2 (예: 기능 추가/수정)
- **ComponentName**: 변경 내용 설명

### API/Export 변경 (해당하는 경우)
```diff
- export {Old} from './old/path';
+ export {New} from './new/path';
```

> **Note**: Breaking changes, 마이그레이션 가이드 등

## Test
- [ ] 구체적인 테스트 항목
~~~

**Guidelines:**
- Group changes by logical category (file structure, features, styles, API, etc.)
- **Bold** affected components/files
- Use diff blocks for API/export before/after comparisons
- Highlight breaking changes with `> **Note**:`
- Test items should be specific, verifiable scenarios

#### 3-2. User confirmation (required)

Show the generated PR content to the user using the current interaction surface and request explicit approval before proceeding:

```
📝 PR 내용을 확인해주세요:

제목: {generated title}

본문:
{generated body}

이대로 PR을 생성/업데이트할까요?
```

- Approved → proceed to 3-3
- Revision requested → incorporate feedback and re-confirm

#### 3-3. Create or update PR

- Check existing PR: `gh pr list --head $(git branch --show-current) --state open`
- If exists: `gh pr edit` to update title/body
- If not: `gh pr create --base develop`

**On success:**
```
✅ PR이 생성(업데이트)되었습니다!
{PR URL}
```

## Rules

- Target branch: always `develop`
- Output messages in **Korean**
- Ticket extraction: match `/([A-Z]+-\d+)/` from branch name
