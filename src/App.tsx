import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { I18nextProvider } from "react-i18next"
import i18next from "i18next"
import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { ProjectBoardsPage } from "@/components/board/project-boards-page"
import { BoardDetailPage } from "@/components/board/board-detail-page"
import { UnifiedKanbanPage } from "@/components/unified/unified-kanban-page"
import { TableViewPage } from "@/components/table/table-view-page"
import { SettingsPage } from "@/components/settings/settings-page"
import { PromptDialogProvider } from "@/components/shared/prompt-dialog"
import { CommandPalette } from "@/components/layout/command-palette"
import { KeyboardShortcutsDialog } from "@/components/layout/keyboard-shortcuts-dialog"
import { CardDetailModal } from "@/components/card-detail/card-detail-modal"
import { Toaster } from "sonner"
import { useState } from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 30, retry: 1 },
  },
})

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
})

const projectBoardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/projects/$projectId",
  component: ProjectBoardsPage,
})

const boardDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/boards/$boardId",
  component: BoardDetailPage,
})

const unifiedKanbanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/unified",
  component: UnifiedKanbanPage,
})

const tableViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/table",
  component: TableViewPage,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  projectBoardsRoute,
  boardDetailRoute,
  unifiedKanbanRoute,
  tableViewRoute,
  settingsRoute,
])

const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

function AppInner() {
  const [searchCardId, setSearchCardId] = useState<string | null>(null)

  return (
    <>
      <RouterProvider router={router} />
      <CommandPalette onSelectCard={setSearchCardId} />
      <KeyboardShortcutsDialog />
      <CardDetailModal cardId={searchCardId} onClose={() => setSearchCardId(null)} />
      <Toaster position="bottom-right" richColors />
    </>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kanban-theme">
      <I18nextProvider i18n={i18next}>
        <QueryClientProvider client={queryClient}>
          <PromptDialogProvider>
            <AppInner />
          </PromptDialogProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ThemeProvider>
  )
}

export default App
