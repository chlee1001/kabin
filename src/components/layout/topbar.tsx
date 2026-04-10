import { useRef, useEffect } from "react"
import { Search, PanelLeftClose, PanelLeft, Moon, Sun, HardDrive, Settings, ChevronRight } from "lucide-react"
import { useRouter, useLocation } from "@tanstack/react-router"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppStore } from "@/stores/app-store"
import { useTheme } from "@/components/theme-provider"
import { useLastBackupTime, useCreateBackup } from "@/hooks/use-backup"
import { useProjects } from "@/hooks/use-projects"
import { useBoard, useAllBoards } from "@/hooks/use-boards"
import { formatDistanceToNow, parseISO } from "date-fns"
import { useTranslation } from "react-i18next"
import { getDateLocale } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function Topbar() {
  const { t } = useTranslation(["layout", "settings"])
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const { theme, setTheme } = useTheme()
  const { data: lastBackup } = useLastBackupTime()
  const createBackup = useCreateBackup()
  const router = useRouter()
  const location = useLocation()
  const headerRef = useRef<HTMLElement>(null)

  // Determine current context from path
  const boardId = location.pathname.startsWith("/boards/") ? location.pathname.split("/")[2] : null
  const projectId = location.pathname.startsWith("/projects/") ? location.pathname.split("/")[2] : null

  const { data: projects } = useProjects()
  const { data: board } = useBoard(boardId || undefined)
  const { data: allBoards } = useAllBoards()

  // Find project if we have a boardId
  const effectiveProjectId = projectId || (boardId && allBoards?.find(b => b.id === boardId)?.project_id)
  const currentProject = projects?.find(p => p.id === effectiveProjectId)

  // Traffic lights are at x:12, extend to ~59px. Sidebar collapsed = 56px wide.
  // When sidebar is closed, topbar needs extra left padding to clear traffic lights.
  // When sidebar is collapsed (56px), traffic lights are inside sidebar area so topbar needs less.
  // When sidebar is collapsed (56px), traffic lights extend ~12px past it into topbar.
  const topbarPaddingLeft = !sidebarOpen
    ? "var(--traffic-light-inset)"
    : sidebarCollapsed
      ? "1.25rem"
      : "0.5rem"

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Only drag if not clicking interactive elements
      if (target.closest("button, a, input, kbd, [role='button']")) return
      e.preventDefault()
      getCurrentWindow().startDragging()
    }

    header.addEventListener("mousedown", handleMouseDown)
    return () => header.removeEventListener("mousedown", handleMouseDown)
  }, [])

  const handleToggleSidebar = () => {
    if (!sidebarOpen) {
      toggleSidebar()
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const backupLabel = lastBackup
    ? t("backupLabel", { time: formatDistanceToNow(parseISO(lastBackup), { addSuffix: true, locale: getDateLocale() }) })
    : t("noBackupYet")

  const isDashboard = location.pathname === "/dashboard"
  const isUnified = location.pathname === "/unified"
  const isTable = location.pathname === "/table"
  const isSettings = location.pathname === "/settings"

  return (
    <header
      ref={headerRef}
      data-tauri-drag-region
      className="topbar-drag flex h-11 items-center justify-between border-b border-border/30 bg-background/95 backdrop-blur-md pr-3 transition-all duration-300"
      style={{ paddingLeft: topbarPaddingLeft }}
    >
      <div className="topbar-no-drag flex items-center gap-0.5 overflow-hidden">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-[28px] w-[28px] shrink-0 text-muted-foreground/60 hover:text-foreground hover:bg-accent/40" 
                onClick={handleToggleSidebar}
              >
                {sidebarCollapsed || !sidebarOpen ? (
                  <PanelLeft className="h-[18px] w-[18px]" />
                ) : (
                  <PanelLeftClose className="h-[18px] w-[18px]" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{sidebarOpen ? t("nav.collapseSidebar", "Collapse sidebar") : t("nav.expandSidebar", "Expand sidebar")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <nav className="flex items-center gap-1 overflow-hidden px-1 text-sm font-medium text-muted-foreground/80">
          {isDashboard && <span className="px-1">{t("nav.dashboard")}</span>}
          {isUnified && <span className="px-1">{t("nav.unifiedKanban")}</span>}
          {isTable && <span className="px-1">{t("nav.tableView")}</span>}
          {isSettings && <span className="px-1">{t("nav.settings")}</span>}
          
          {currentProject && (
            <div className="flex items-center gap-1 overflow-hidden">
              <span 
                className="truncate px-1 hover:text-foreground cursor-pointer transition-colors"
                onClick={() => router.navigate({ to: "/projects/$projectId", params: { projectId: currentProject.id } })}
              >
                {currentProject.name}
              </span>
              {board && (
                <>
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />
                  <span className="truncate px-1 text-foreground cursor-default">{board.name}</span>
                </>
              )}
            </div>
          )}
        </nav>
      </div>

      <div className="topbar-no-drag flex items-center gap-0.5">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-[28px] w-[28px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/40"
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }}
              >
                <Search className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <p className="text-xs">{t("search")}</p>
                <kbd className="rounded border border-border bg-muted px-1 py-0 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-[28px] w-[28px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/40",
                  createBackup.isPending && "animate-pulse",
                )}
                onClick={() => {
                  createBackup.mutate(undefined, {
                    onSuccess: () => toast.success(t("settings:backupCreated")),
                    onError: (err) => toast.error(t("settings:backupFailed", { error: String(err) })),
                  })
                }}
                disabled={createBackup.isPending}
              >
                <HardDrive className={cn("h-[18px] w-[18px]", lastBackup ? "text-primary/60" : "")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{backupLabel}</p>
              <p className="text-[10px] text-muted-foreground">{t("backupHint")}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-[28px] w-[28px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/40" 
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{theme === "dark" ? "Light Mode" : "Dark Mode"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-[28px] w-[28px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/40"
                onClick={() => router.navigate({ to: "/settings" })}
              >
                <Settings className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{t("nav.settings")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
