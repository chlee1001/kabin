import {
  projectApi,
  boardApi,
  columnApi,
  cardApi,
  subtaskApi,
  tagApi,
  type StatusCategory,
} from "./tauri"

// ─── Helpers ────────────────────────────────────────────

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function tiptapDoc(text: string): string {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  })
}

// ─── Seed Data Definition ───────────────────────────────

interface SeedColumn {
  name: string
  status: StatusCategory
  cards: {
    title: string
    description?: string
    color?: string
    due_date?: string
    start_date?: string
    completed?: boolean
    subtasks?: { title: string; completed: boolean }[]
    tags?: string[]
  }[]
}

interface SeedBoard {
  name: string
  columns: SeedColumn[]
}

interface SeedProject {
  name: string
  color: string
  boards: SeedBoard[]
}

const TAG_DEFS: Record<string, string> = {
  "Bug": "#ef4444",
  "Feature": "#3b82f6",
  "Design": "#a855f7",
  "Backend": "#f97316",
  "Frontend": "#06b6d4",
  "Urgent": "#dc2626",
  "Research": "#8b5cf6",
  "DevOps": "#64748b",
  "QA": "#10b981",
  "Documentation": "#eab308",
}

const PROJECTS: SeedProject[] = [
  {
    name: "LFin Mobile App",
    color: "#3b82f6",
    boards: [
      {
        name: "Sprint 24 - Q2",
        columns: [
          {
            name: "Backlog",
            status: "todo",
            cards: [
              {
                title: "Push notification 설정 화면",
                description: "사용자별 알림 카테고리 on/off 설정 UI 구현",
                tags: ["Feature", "Frontend"],
                due_date: daysFromNow(14),
                subtasks: [
                  { title: "알림 카테고리 목록 API 연동", completed: false },
                  { title: "토글 스위치 UI 구현", completed: false },
                  { title: "설정 저장 로직", completed: false },
                ],
              },
              {
                title: "다크모드 색상 보정",
                description: "차트 컴포넌트의 다크모드 색상 대비 개선",
                tags: ["Design", "Frontend"],
                due_date: daysFromNow(10),
              },
              {
                title: "API 응답 캐싱 전략 수립",
                description: "React Query staleTime / gcTime 정책 통일",
                tags: ["Research", "Frontend"],
              },
            ],
          },
          {
            name: "In Progress",
            status: "in_progress",
            cards: [
              {
                title: "포트폴리오 수익률 차트",
                description: "일/주/월/연 단위 수익률 라인 차트 구현. Recharts 사용",
                color: "#3b82f6",
                tags: ["Feature", "Frontend"],
                start_date: daysFromNow(-3),
                due_date: daysFromNow(4),
                subtasks: [
                  { title: "차트 컴포넌트 레이아웃", completed: true },
                  { title: "기간 필터 구현", completed: true },
                  { title: "실시간 데이터 연동", completed: false },
                  { title: "터치 인터랙션 (모바일)", completed: false },
                ],
              },
              {
                title: "생체 인증 로그인",
                description: "Face ID / 지문 인증 연동",
                color: "#f97316",
                tags: ["Feature", "Backend"],
                start_date: daysFromNow(-5),
                due_date: daysFromNow(2),
                subtasks: [
                  { title: "iOS Face ID 연동", completed: true },
                  { title: "Android 지문 연동", completed: true },
                  { title: "Fallback PIN 입력", completed: false },
                ],
              },
            ],
          },
          {
            name: "Review",
            status: "in_progress",
            cards: [
              {
                title: "자산 배분 파이 차트 리팩토링",
                description: "기존 D3 차트를 Recharts로 마이그레이션",
                tags: ["Frontend"],
                start_date: daysFromNow(-7),
                due_date: daysFromNow(1),
              },
            ],
          },
          {
            name: "Done",
            status: "done",
            cards: [
              {
                title: "로그인 화면 UI 리디자인",
                description: "Figma 시안 기반 로그인/회원가입 화면 구현 완료",
                tags: ["Design", "Frontend"],
                completed: true,
                subtasks: [
                  { title: "로그인 폼 레이아웃", completed: true },
                  { title: "소셜 로그인 버튼", completed: true },
                  { title: "비밀번호 찾기 플로우", completed: true },
                ],
              },
              {
                title: "JWT 토큰 갱신 로직 수정",
                description: "Refresh token rotation 적용",
                tags: ["Bug", "Backend"],
                completed: true,
              },
              {
                title: "Sentry 에러 트래킹 설정",
                description: "React Native + Sentry SDK 연동, sourcemap 업로드 자동화",
                tags: ["DevOps"],
                completed: true,
              },
            ],
          },
        ],
      },
      {
        name: "Bug Tracker",
        columns: [
          {
            name: "Reported",
            status: "todo",
            cards: [
              {
                title: "iOS 키보드가 입력 필드를 가림",
                description: "iPhone SE에서 금액 입력 시 키보드가 입력 필드를 덮는 현상",
                color: "#ef4444",
                tags: ["Bug", "Frontend"],
                due_date: daysFromNow(3),
              },
              {
                title: "차트 로딩 시 깜빡임",
                description: "포트폴리오 탭 진입 시 차트 영역이 0.5초 정도 깜빡거림",
                tags: ["Bug", "Frontend"],
                due_date: daysFromNow(7),
              },
            ],
          },
          {
            name: "Fixing",
            status: "in_progress",
            cards: [
              {
                title: "Android 뒤로가기 시 앱 종료",
                description: "메인 화면에서 뒤로가기 누르면 확인 없이 앱이 종료됨",
                color: "#ef4444",
                tags: ["Bug", "Urgent"],
                start_date: daysFromNow(-1),
                due_date: daysFromNow(1),
              },
            ],
          },
          {
            name: "Resolved",
            status: "done",
            cards: [
              {
                title: "로그아웃 후 캐시 미삭제",
                tags: ["Bug", "Backend"],
                completed: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "회사 웹사이트 리뉴얼",
    color: "#8b5cf6",
    boards: [
      {
        name: "Design",
        columns: [
          {
            name: "To Do",
            status: "todo",
            cards: [
              {
                title: "랜딩 페이지 히어로 섹션",
                description: "메인 비주얼 + CTA 버튼 + 핵심 메시지",
                tags: ["Design"],
                due_date: daysFromNow(5),
                subtasks: [
                  { title: "카피라이팅 초안", completed: true },
                  { title: "일러스트 소스 확보", completed: false },
                  { title: "반응형 레이아웃 설계", completed: false },
                ],
              },
              {
                title: "회사 소개 페이지",
                description: "팀 소개, 연혁, 미션/비전 섹션",
                tags: ["Design"],
                due_date: daysFromNow(12),
              },
              {
                title: "문의 폼 디자인",
                tags: ["Design", "Frontend"],
                due_date: daysFromNow(15),
              },
            ],
          },
          {
            name: "In Progress",
            status: "in_progress",
            cards: [
              {
                title: "디자인 시스템 구축",
                description: "색상, 타이포그래피, 컴포넌트 라이브러리 정의",
                color: "#8b5cf6",
                tags: ["Design"],
                start_date: daysFromNow(-10),
                due_date: daysFromNow(3),
                subtasks: [
                  { title: "색상 팔레트 확정", completed: true },
                  { title: "타이포그래피 스케일", completed: true },
                  { title: "버튼 / 인풋 컴포넌트", completed: true },
                  { title: "카드 / 모달 컴포넌트", completed: false },
                  { title: "아이콘 세트 선정", completed: false },
                ],
              },
            ],
          },
          {
            name: "Review",
            status: "in_progress",
            cards: [
              {
                title: "와이어프레임 v2",
                description: "전체 페이지 와이어프레임 2차 수정본",
                tags: ["Design"],
                start_date: daysFromNow(-14),
              },
            ],
          },
          {
            name: "Approved",
            status: "done",
            cards: [
              {
                title: "IA(정보 구조) 설계",
                description: "사이트맵 + 네비게이션 구조 확정",
                tags: ["Design", "Research"],
                completed: true,
              },
              {
                title: "경쟁사 벤치마킹",
                description: "핀테크 5개사 웹사이트 디자인 분석",
                tags: ["Research"],
                completed: true,
              },
            ],
          },
        ],
      },
      {
        name: "Development",
        columns: [
          {
            name: "Backlog",
            status: "todo",
            cards: [
              {
                title: "Next.js 프로젝트 세팅",
                description: "Next.js 14 + Tailwind + Framer Motion 초기 설정",
                tags: ["Frontend", "DevOps"],
                due_date: daysFromNow(7),
                subtasks: [
                  { title: "레포 생성 및 CI 설정", completed: false },
                  { title: "Tailwind config", completed: false },
                  { title: "ESLint + Prettier", completed: false },
                  { title: "Vercel 배포 연결", completed: false },
                ],
              },
              {
                title: "CMS 연동 (Sanity)",
                description: "블로그/뉴스 콘텐츠 관리를 위한 Sanity CMS 연동",
                tags: ["Backend", "Feature"],
                due_date: daysFromNow(20),
              },
              {
                title: "SEO 메타태그 설정",
                tags: ["Frontend"],
                due_date: daysFromNow(18),
              },
              {
                title: "Google Analytics 4 연동",
                tags: ["DevOps"],
              },
            ],
          },
          {
            name: "In Progress",
            status: "in_progress",
            cards: [],
          },
          {
            name: "Done",
            status: "done",
            cards: [
              {
                title: "도메인 및 호스팅 준비",
                description: "Vercel Pro 플랜 + 도메인 DNS 설정",
                tags: ["DevOps"],
                completed: true,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Internal Tools",
    color: "#10b981",
    boards: [
      {
        name: "Admin Dashboard",
        columns: [
          {
            name: "To Do",
            status: "todo",
            cards: [
              {
                title: "사용자 관리 테이블",
                description: "검색/필터/정렬이 가능한 사용자 목록 테이블",
                tags: ["Feature", "Frontend"],
                due_date: daysFromNow(8),
                subtasks: [
                  { title: "TanStack Table 연동", completed: false },
                  { title: "검색 필터 UI", completed: false },
                  { title: "페이지네이션", completed: false },
                  { title: "CSV 내보내기", completed: false },
                ],
              },
              {
                title: "대시보드 KPI 위젯",
                description: "MAU, DAU, 매출, 전환율 등 주요 지표 카드",
                tags: ["Feature", "Frontend"],
                due_date: daysFromNow(10),
              },
              {
                title: "권한 관리 (RBAC)",
                description: "역할 기반 접근 제어 시스템 설계 및 구현",
                tags: ["Backend", "Feature"],
                due_date: daysFromNow(21),
              },
            ],
          },
          {
            name: "In Progress",
            status: "in_progress",
            cards: [
              {
                title: "인증 시스템 구축",
                description: "NextAuth.js 기반 로그인 + 세션 관리",
                color: "#10b981",
                tags: ["Backend", "Feature"],
                start_date: daysFromNow(-4),
                due_date: daysFromNow(3),
                subtasks: [
                  { title: "NextAuth 설정", completed: true },
                  { title: "Google OAuth 연동", completed: true },
                  { title: "세션 미들웨어", completed: false },
                  { title: "로그인 UI", completed: false },
                ],
              },
            ],
          },
          {
            name: "QA",
            status: "in_progress",
            cards: [
              {
                title: "API 엔드포인트 테스트",
                description: "Vitest + MSW 기반 API 통합 테스트 작성",
                tags: ["QA", "Backend"],
                start_date: daysFromNow(-2),
                due_date: daysFromNow(5),
              },
            ],
          },
          {
            name: "Done",
            status: "done",
            cards: [
              {
                title: "프로젝트 초기 세팅",
                description: "Turborepo + pnpm workspace 모노레포 구성",
                tags: ["DevOps"],
                completed: true,
              },
              {
                title: "DB 스키마 설계",
                description: "PostgreSQL + Drizzle ORM 스키마 정의",
                tags: ["Backend"],
                completed: true,
              },
              {
                title: "API 문서 자동화",
                description: "Swagger/OpenAPI 스펙 자동 생성 설정",
                tags: ["Documentation", "Backend"],
                completed: true,
              },
            ],
          },
        ],
      },
    ],
  },
]

// ─── Reset Runner ───────────────────────────────────────

export async function resetAllData(): Promise<void> {
  const [projects, tags] = await Promise.all([
    projectApi.list(),
    tagApi.list(),
  ])

  for (const project of projects) {
    await projectApi.delete(project.id)
  }

  for (const tag of tags) {
    await tagApi.delete(tag.id)
  }
}

// ─── Seed Runner ────────────────────────────────────────

export async function seedDemoData(
  onProgress?: (msg: string) => void,
): Promise<void> {
  const log = onProgress ?? (() => {})

  // 1. Create tags
  log("Creating tags...")
  const tagMap: Record<string, string> = {}
  for (const [name, color] of Object.entries(TAG_DEFS)) {
    const tag = await tagApi.create(name, color)
    tagMap[name] = tag.id
  }

  // 2. Create projects, boards, columns, cards
  for (const proj of PROJECTS) {
    log(`Creating project: ${proj.name}`)
    const project = await projectApi.create(proj.name, proj.color)

    for (const brd of proj.boards) {
      log(`  Board: ${brd.name}`)
      const board = await boardApi.create(project.id, brd.name)

      for (const col of brd.columns) {
        const column = await columnApi.create(board.id, col.name, col.status)

        for (const crd of col.cards) {
          const card = await cardApi.create(
            column.id,
            crd.title,
            crd.description ? tiptapDoc(crd.description) : undefined,
          )

          // Update optional fields
          const updates: Record<string, unknown> = {}
          if (crd.color) updates.color = crd.color
          if (crd.due_date) updates.due_date = crd.due_date
          if (crd.start_date) updates.start_date = crd.start_date
          if (crd.completed) updates.completed = true

          if (Object.keys(updates).length > 0) {
            await cardApi.update(card.id, updates)
          }

          // Add tags
          if (crd.tags) {
            for (const tagName of crd.tags) {
              if (tagMap[tagName]) {
                await tagApi.addToCard(card.id, tagMap[tagName])
              }
            }
          }

          // Add subtasks
          if (crd.subtasks) {
            for (const st of crd.subtasks) {
              const subtask = await subtaskApi.create(card.id, st.title)
              if (st.completed) {
                await subtaskApi.update(subtask.id, undefined, true)
              }
            }
          }
        }
      }
    }
  }

  log("Done!")
}
