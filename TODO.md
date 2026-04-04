# Kanban App — 미구현 항목

ralplan 완료 기준 대비 남은 작업 목록. 우선순위 순 정렬.

## 중간 우선순위

### 테이블 뷰 가상 스크롤
- `@tanstack/react-virtual`을 `table-view-page.tsx`에 적용
- 통합 칸반은 이미 적용됨. 테이블 뷰는 현재 전체 DOM 렌더링
- 2000카드 기준으로 체감 차이가 클 수 있음
- 관련 파일: `src/components/table/table-view-page.tsx`

### 설정 페이지 백업 주기 변경 UI
- 현재 백업 주기가 Rust 코드에 하드코딩 (3600초 = 1시간)
- `settings` 테이블에 `backup_interval_secs` 키 추가
- 설정 페이지에서 드롭다운으로 선택 (30분/1시간/매일/수동만)
- `lib.rs`의 auto-backup 스레드에서 설정값 읽도록 수정
- 관련 파일: `src-tauri/src/lib.rs`, `src/components/settings/settings-page.tsx`

### 슬라이드 롤백 애니메이션
- DnD 실패 시 카드가 원래 위치로 돌아가는 시각적 애니메이션
- `board-card.tsx`에 CSS transition 추가
- `framer-motion` 도입 또는 CSS keyframe으로 구현
- 관련 파일: `src/components/board/board-card.tsx`

## 낮은 우선순위

### 컨텍스트 메뉴 (우클릭)
- 프로젝트/보드/카드에 우클릭 시 편집/삭제/이동 메뉴
- shadcn/ui `ContextMenu` 컴포넌트 사용
- 사이드바 프로젝트 항목 + 보드 카드에 적용
- 관련 파일: `src/components/layout/sidebar.tsx`, `src/components/board/board-card.tsx`

### WCAG AA 명암비 체크
- 프로젝트 색상 배지 위 텍스트가 4.5:1 명암비 준수하는지 검증
- 다크/라이트 모드 모두 체크
- 밝은 배경색에 흰 텍스트 → 읽기 어려운 조합 방지
- `project-badge.tsx` 또는 색상 유틸에 자동 명암 계산 함수 추가

### 2000카드 성능 벤치마크
- ralplan에 명시된 시드 데이터 생성 Rust 커맨드 구현
  ```rust
  fn seed_test_data(projects: u32, boards_per_project: u32, cards_per_board: u32)
  ```
- 10 프로젝트 × 3 보드 × 70 카드 = 2100 카드 생성
- Chrome DevTools Protocol로 frame drop / interaction latency 측정
- 기준: interaction latency < 100ms, frame drop < 5%, drag feedback < 16ms
- 관련 파일: `src-tauri/src/commands/` (새 dev.rs 파일)

### 서브태스크 드래그 순서 변경 UI
- `subtask-list.tsx`에서 서브태스크 항목을 드래그로 순서 변경
- `reorder_subtasks` API는 이미 구현됨
- pragmatic-drag-and-drop 또는 간단한 상하 버튼으로 구현
- 관련 파일: `src/components/card-detail/subtask-list.tsx`

### 통합 칸반 필터 바 UI
- 통합 칸반보드에도 테이블 뷰와 같은 FilterBar 추가
- `unified-kanban-page.tsx`에 FilterBar 연결 + `useFilteredCards` 사용
- 관련 파일: `src/components/unified/unified-kanban-page.tsx`

### 통합 칸반 매핑 충돌 toast
- 상태 변경 시 원본 프로젝트에 해당 카테고리 컬럼이 없으면 toast 알림
- 현재 Rust에서 에러 반환하지만 프론트에서 구체적 메시지 미표시
- `"'{카드}'이 '{프로젝트} > {컬럼}'으로 이동"` 형태 toast
- 관련 파일: `src/components/unified/unified-kanban-page.tsx`
