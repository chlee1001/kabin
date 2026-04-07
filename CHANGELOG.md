# Changelog

## [0.1.8](https://github.com/chlee1001/kabin/compare/kabin-v0.1.7...kabin-v0.1.8) (2026-04-06)


### Features

* add i18n support with EN/KO translations and UX writing renewal ([42af4c5](https://github.com/chlee1001/kabin/commit/42af4c5c5eccdbd345205699fe490831d0ce7504))
* DB 내보내기/가져오기 기능 추가 ([ea3eb47](https://github.com/chlee1001/kabin/commit/ea3eb4749547355ff4c2ff4dc10dfe045181089a))
* DnD 시각 피드백 개선, 칸반 열 레이아웃 수정, 사이드바 접힌 상태 UX 강화 ([63722db](https://github.com/chlee1001/kabin/commit/63722db8dc681de7e6dbc3d2cc270ff6d76daaa4))
* **import:** Kanri/Trello JSON 데이터 가져오기 기능 추가 ([8500f11](https://github.com/chlee1001/kabin/commit/8500f111f8727fa5c54b9438840d7114d2c86a81))
* **import:** Kanri/Trello JSON 데이터 가져오기 기능 추가 ([03b7b6b](https://github.com/chlee1001/kabin/commit/03b7b6b4062fa1627f8602d7eac9fc5a100d8123))
* **kanban:** 칸반 보드 데스크탑 앱 초기 구현 ([9545b0e](https://github.com/chlee1001/kabin/commit/9545b0e9e47c29ba6958a6d59cd6a5b365a6b177))
* 강조색 선택 시 앱 전체 중립색에 accent hue 틴트 적용 ([c0fda91](https://github.com/chlee1001/kabin/commit/c0fda9114d53460072afc01b11c39facda75842a))
* 서브태스크 인라인 수정, 삭제, DnD 순서 변경 구현 ([c5eef73](https://github.com/chlee1001/kabin/commit/c5eef73761427f1c8d8bb3bc51b3ae90c0fda98b))
* 설정 페이지 UI/UX 개선 및 태그 관리 접근성 강화 ([49b91b0](https://github.com/chlee1001/kabin/commit/49b91b0d944182eb0a5458527cbeb2d530d018c4))
* 설정 페이지에 About 섹션 추가 ([813d622](https://github.com/chlee1001/kabin/commit/813d622670c94a3bcfb64d899a19e55f7096e585))
* 설정 페이지에 데모 데이터 삽입 및 데이터 초기화 기능 추가 ([6c95802](https://github.com/chlee1001/kabin/commit/6c95802f90ba4bedd8cb12f34b600e33e0a5f52a))
* 앱 이름 커스텀 설정, 태그 pill 표시, 통합 칸반 마감일 개선 ([7bf9dd9](https://github.com/chlee1001/kabin/commit/7bf9dd9cdc11170803e6a804f1385448c5327d2e))
* 테이블 가상 스크롤, 백업 주기 설정, 통합 칸반 toast 개선 ([8085269](https://github.com/chlee1001/kabin/commit/8085269810c7232bd750bb126b6ba79460408d61))
* 통합 칸반 카드 순서 DnD 리오더 지원 ([306c4af](https://github.com/chlee1001/kabin/commit/306c4af758542fabdb94d38368136957ff1b904a))
* 필터 UI 개선 및 키보드 단축키 시스템 구현 ([15cbcff](https://github.com/chlee1001/kabin/commit/15cbcff657bb76443c3450f8c3fe633ce34a3bba))


### Bug Fixes

* **hooks:** Backspace 키 뒤로가기 방지 ([d436bfc](https://github.com/chlee1001/kabin/commit/d436bfcdb17cf526d2dbef0ea7f04d41717bb612))
* **hooks:** 필터 검색 입력 시 포커스 유실 방지 ([199b343](https://github.com/chlee1001/kabin/commit/199b34301707bb6b3e69b8a5897f5db06f95d426))
* **hooks:** 필터 검색 포커스 유실 및 Backspace 뒤로가기 방지 ([b696890](https://github.com/chlee1001/kabin/commit/b696890e22b5c126a8e9b809bd34758f9505fec6))
* release 이름 kabin으로 변경 및 빌드 workflow 통합 ([76af70e](https://github.com/chlee1001/kabin/commit/76af70e280962ea753f5f4891d27503169debc14))
* sidebar 프로젝트/보드 이름 클릭 시 확장·이동 동작 복원 ([814fce0](https://github.com/chlee1001/kabin/commit/814fce03ee5c254917cf4e3799ca99264959d8a1))
* **sidebar:** 긴 프로젝트/보드명에 메뉴 버튼이 가려지는 문제 수정 ([32935f4](https://github.com/chlee1001/kabin/commit/32935f44cabe3bcf53f5fcfeb5d16dd57146f086))
* **sidebar:** 긴 프로젝트/보드명에 메뉴 버튼이 가려지는 문제 수정 ([8caf60a](https://github.com/chlee1001/kabin/commit/8caf60a68645620de3e0c725f71dfad231aa4e24))
* 대시보드 마감 임박 표현 개선 및 기준일 7일→5일 변경 ([3fcc64f](https://github.com/chlee1001/kabin/commit/3fcc64f545d1cc165e00c91b438d0cf18353f743))
* 보드 배경 이미지 업로드 수정 및 frosted glass UI 적용 ([25fc027](https://github.com/chlee1001/kabin/commit/25fc027da91e1e29ff0d66c1e4a0471868fdb2bf))
* 보드/통합칸반에서 카드 DnD 시 원하는 위치에 삽입 가능하도록 개선 ([ae13151](https://github.com/chlee1001/kabin/commit/ae13151ef7be86766bbcdf6ab40c75e3fb34c379))
* 카드 DnD 시 원하는 위치에 삽입 가능하도록 개선 ([ea9ec8a](https://github.com/chlee1001/kabin/commit/ea9ec8ab5c0ad38e11f51f656e9537d1bf0459b6))
* 테이블 뷰 완료 컬럼 너비 조정 (w-12 → w-15) ([c7728bd](https://github.com/chlee1001/kabin/commit/c7728bd547bbf2b4694d9f9f279c4435c9a706a0))
* 통합 칸반 카드 겹침/여백 및 드래그 프리뷰 버그 수정 ([a06f150](https://github.com/chlee1001/kabin/commit/a06f1505c54e26fd2f1d6b5ea8739c4c0a58b339))

## [0.1.7](https://github.com/chlee1001/kabin/compare/kabin-v0.1.6...kabin-v0.1.7) (2026-04-06)


### Features

* **import:** Kanri/Trello JSON 데이터 가져오기 기능 추가 ([8500f11](https://github.com/chlee1001/kabin/commit/8500f111f8727fa5c54b9438840d7114d2c86a81))
* **import:** Kanri/Trello JSON 데이터 가져오기 기능 추가 ([03b7b6b](https://github.com/chlee1001/kabin/commit/03b7b6b4062fa1627f8602d7eac9fc5a100d8123))

## [0.1.6](https://github.com/chlee1001/kabin/compare/kabin-v0.1.5...kabin-v0.1.6) (2026-04-06)


### Bug Fixes

* **sidebar:** 긴 프로젝트/보드명에 메뉴 버튼이 가려지는 문제 수정 ([32935f4](https://github.com/chlee1001/kabin/commit/32935f44cabe3bcf53f5fcfeb5d16dd57146f086))
* **sidebar:** 긴 프로젝트/보드명에 메뉴 버튼이 가려지는 문제 수정 ([8caf60a](https://github.com/chlee1001/kabin/commit/8caf60a68645620de3e0c725f71dfad231aa4e24))

## [0.1.5](https://github.com/chlee1001/kabin/compare/kabin-v0.1.4...kabin-v0.1.5) (2026-04-06)


### Bug Fixes

* **hooks:** Backspace 키 뒤로가기 방지 ([d436bfc](https://github.com/chlee1001/kabin/commit/d436bfcdb17cf526d2dbef0ea7f04d41717bb612))
* **hooks:** 필터 검색 입력 시 포커스 유실 방지 ([199b343](https://github.com/chlee1001/kabin/commit/199b34301707bb6b3e69b8a5897f5db06f95d426))
* **hooks:** 필터 검색 포커스 유실 및 Backspace 뒤로가기 방지 ([b696890](https://github.com/chlee1001/kabin/commit/b696890e22b5c126a8e9b809bd34758f9505fec6))

## [0.1.4](https://github.com/chlee1001/kabin/compare/kabin-v0.1.3...kabin-v0.1.4) (2026-04-06)


### Bug Fixes

* 보드/통합칸반에서 카드 DnD 시 원하는 위치에 삽입 가능하도록 개선 ([ae13151](https://github.com/chlee1001/kabin/commit/ae13151ef7be86766bbcdf6ab40c75e3fb34c379))
* 카드 DnD 시 원하는 위치에 삽입 가능하도록 개선 ([ea9ec8a](https://github.com/chlee1001/kabin/commit/ea9ec8ab5c0ad38e11f51f656e9537d1bf0459b6))

## [0.1.3](https://github.com/chlee1001/kabin/compare/kabin-v0.1.2...kabin-v0.1.3) (2026-04-06)


### Features

* 설정 페이지에 데모 데이터 삽입 및 데이터 초기화 기능 추가 ([6c95802](https://github.com/chlee1001/kabin/commit/6c95802f90ba4bedd8cb12f34b600e33e0a5f52a))


### Bug Fixes

* 대시보드 마감 임박 표현 개선 및 기준일 7일→5일 변경 ([3fcc64f](https://github.com/chlee1001/kabin/commit/3fcc64f545d1cc165e00c91b438d0cf18353f743))

## [0.1.2](https://github.com/chlee1001/kabin/compare/kabin-v0.1.1...kabin-v0.1.2) (2026-04-06)


### Features

* add i18n support with EN/KO translations and UX writing renewal ([42af4c5](https://github.com/chlee1001/kabin/commit/42af4c5c5eccdbd345205699fe490831d0ce7504))
* DB 내보내기/가져오기 기능 추가 ([ea3eb47](https://github.com/chlee1001/kabin/commit/ea3eb4749547355ff4c2ff4dc10dfe045181089a))
* DnD 시각 피드백 개선, 칸반 열 레이아웃 수정, 사이드바 접힌 상태 UX 강화 ([63722db](https://github.com/chlee1001/kabin/commit/63722db8dc681de7e6dbc3d2cc270ff6d76daaa4))
* **kanban:** 칸반 보드 데스크탑 앱 초기 구현 ([9545b0e](https://github.com/chlee1001/kabin/commit/9545b0e9e47c29ba6958a6d59cd6a5b365a6b177))
* 강조색 선택 시 앱 전체 중립색에 accent hue 틴트 적용 ([c0fda91](https://github.com/chlee1001/kabin/commit/c0fda9114d53460072afc01b11c39facda75842a))
* 서브태스크 인라인 수정, 삭제, DnD 순서 변경 구현 ([c5eef73](https://github.com/chlee1001/kabin/commit/c5eef73761427f1c8d8bb3bc51b3ae90c0fda98b))
* 설정 페이지 UI/UX 개선 및 태그 관리 접근성 강화 ([49b91b0](https://github.com/chlee1001/kabin/commit/49b91b0d944182eb0a5458527cbeb2d530d018c4))
* 설정 페이지에 About 섹션 추가 ([813d622](https://github.com/chlee1001/kabin/commit/813d622670c94a3bcfb64d899a19e55f7096e585))
* 앱 이름 커스텀 설정, 태그 pill 표시, 통합 칸반 마감일 개선 ([7bf9dd9](https://github.com/chlee1001/kabin/commit/7bf9dd9cdc11170803e6a804f1385448c5327d2e))
* 테이블 가상 스크롤, 백업 주기 설정, 통합 칸반 toast 개선 ([8085269](https://github.com/chlee1001/kabin/commit/8085269810c7232bd750bb126b6ba79460408d61))
* 통합 칸반 카드 순서 DnD 리오더 지원 ([306c4af](https://github.com/chlee1001/kabin/commit/306c4af758542fabdb94d38368136957ff1b904a))
* 필터 UI 개선 및 키보드 단축키 시스템 구현 ([15cbcff](https://github.com/chlee1001/kabin/commit/15cbcff657bb76443c3450f8c3fe633ce34a3bba))


### Bug Fixes

* release 이름 kabin으로 변경 및 빌드 workflow 통합 ([76af70e](https://github.com/chlee1001/kabin/commit/76af70e280962ea753f5f4891d27503169debc14))
* sidebar 프로젝트/보드 이름 클릭 시 확장·이동 동작 복원 ([814fce0](https://github.com/chlee1001/kabin/commit/814fce03ee5c254917cf4e3799ca99264959d8a1))
* 보드 배경 이미지 업로드 수정 및 frosted glass UI 적용 ([25fc027](https://github.com/chlee1001/kabin/commit/25fc027da91e1e29ff0d66c1e4a0471868fdb2bf))
* 테이블 뷰 완료 컬럼 너비 조정 (w-12 → w-15) ([c7728bd](https://github.com/chlee1001/kabin/commit/c7728bd547bbf2b4694d9f9f279c4435c9a706a0))
* 통합 칸반 카드 겹침/여백 및 드래그 프리뷰 버그 수정 ([a06f150](https://github.com/chlee1001/kabin/commit/a06f1505c54e26fd2f1d6b5ea8739c4c0a58b339))

## [0.1.1](https://github.com/chlee1001/kabin/compare/kanban-v0.1.0...kanban-v0.1.1) (2026-04-06)


### Features

* add i18n support with EN/KO translations and UX writing renewal ([42af4c5](https://github.com/chlee1001/kabin/commit/42af4c5c5eccdbd345205699fe490831d0ce7504))
* DB 내보내기/가져오기 기능 추가 ([ea3eb47](https://github.com/chlee1001/kabin/commit/ea3eb4749547355ff4c2ff4dc10dfe045181089a))
* DnD 시각 피드백 개선, 칸반 열 레이아웃 수정, 사이드바 접힌 상태 UX 강화 ([63722db](https://github.com/chlee1001/kabin/commit/63722db8dc681de7e6dbc3d2cc270ff6d76daaa4))
* **kanban:** 칸반 보드 데스크탑 앱 초기 구현 ([9545b0e](https://github.com/chlee1001/kabin/commit/9545b0e9e47c29ba6958a6d59cd6a5b365a6b177))
* 강조색 선택 시 앱 전체 중립색에 accent hue 틴트 적용 ([c0fda91](https://github.com/chlee1001/kabin/commit/c0fda9114d53460072afc01b11c39facda75842a))
* 서브태스크 인라인 수정, 삭제, DnD 순서 변경 구현 ([c5eef73](https://github.com/chlee1001/kabin/commit/c5eef73761427f1c8d8bb3bc51b3ae90c0fda98b))
* 설정 페이지 UI/UX 개선 및 태그 관리 접근성 강화 ([49b91b0](https://github.com/chlee1001/kabin/commit/49b91b0d944182eb0a5458527cbeb2d530d018c4))
* 설정 페이지에 About 섹션 추가 ([813d622](https://github.com/chlee1001/kabin/commit/813d622670c94a3bcfb64d899a19e55f7096e585))
* 앱 이름 커스텀 설정, 태그 pill 표시, 통합 칸반 마감일 개선 ([7bf9dd9](https://github.com/chlee1001/kabin/commit/7bf9dd9cdc11170803e6a804f1385448c5327d2e))
* 테이블 가상 스크롤, 백업 주기 설정, 통합 칸반 toast 개선 ([8085269](https://github.com/chlee1001/kabin/commit/8085269810c7232bd750bb126b6ba79460408d61))
* 통합 칸반 카드 순서 DnD 리오더 지원 ([306c4af](https://github.com/chlee1001/kabin/commit/306c4af758542fabdb94d38368136957ff1b904a))
* 필터 UI 개선 및 키보드 단축키 시스템 구현 ([15cbcff](https://github.com/chlee1001/kabin/commit/15cbcff657bb76443c3450f8c3fe633ce34a3bba))


### Bug Fixes

* sidebar 프로젝트/보드 이름 클릭 시 확장·이동 동작 복원 ([814fce0](https://github.com/chlee1001/kabin/commit/814fce03ee5c254917cf4e3799ca99264959d8a1))
* 보드 배경 이미지 업로드 수정 및 frosted glass UI 적용 ([25fc027](https://github.com/chlee1001/kabin/commit/25fc027da91e1e29ff0d66c1e4a0471868fdb2bf))
* 테이블 뷰 완료 컬럼 너비 조정 (w-12 → w-15) ([c7728bd](https://github.com/chlee1001/kabin/commit/c7728bd547bbf2b4694d9f9f279c4435c9a706a0))
* 통합 칸반 카드 겹침/여백 및 드래그 프리뷰 버그 수정 ([a06f150](https://github.com/chlee1001/kabin/commit/a06f1505c54e26fd2f1d6b5ea8739c4c0a58b339))
