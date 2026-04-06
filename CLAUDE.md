# Project: Kabin (Kanban Desktop App)

Tauri 2 + React 19 + TypeScript + SQLite 기반 오프라인 칸반 데스크톱 앱.

## Git Workflow

커밋/PR 생성 시 `.claude/skills/git/` 스킬을 사용할 것.

이 프로젝트의 오버라이드:
- 기본 브랜치: `main` (develop 브랜치 없음)
- PR 타겟: 항상 `main`
- Jira 티켓 없음 — 커밋/PR에 티켓 접두사 생략

## Tech Stack

- Frontend: React 19, TypeScript, TanStack Router/Query, Tailwind CSS, shadcn/ui
- Backend: Tauri 2 (Rust), SQLite (rusqlite)
- i18n: i18next (ko/en, namespace-by-feature)
- DnD: @atlaskit/pragmatic-drag-and-drop

## Key Patterns

- 카드 mutation 후 반드시 캐시 무효화: `cards`, `unified-cards`, `filtered-cards`, `project-summaries`, `urgent-cards`
- 정렬 모드가 `manual`일 때만 DnD 허용
- 불변 패턴 사용 (객체 직접 수정 금지)
