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

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
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
      className="topbar-drag relative flex h-8 items-center justify-between border-b border-border/30 bg-background/95 backdrop-blur-md pr-2 select-none"
      style={{ paddingLeft: "var(--traffic-light-inset)" }}
    >
      <div className="traffic-light-backdrop" aria-hidden="true" />
      <div className="topbar-no-drag flex items-center gap-0.5 overflow-hidden">
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6.5 w-6.5 shrink-0 text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors" 
                onClick={handleToggleSidebar}
              >
                {sidebarCollapsed || !sidebarOpen ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              <p>{sidebarOpen ? t("nav.collapseSidebar", "Collapse sidebar") : t("nav.expandSidebar", "Expand sidebar")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <nav className="flex items-center gap-0.5 overflow-hidden px-1 text-[13px] font-medium text-muted-foreground/70">
          {isDashboard && <span className="px-1">{t("nav.dashboard")}</span>}
          {isUnified && <span className="px-1">{t("nav.unifiedKanban")}</span>}
          {isTable && <span className="px-1">{t("nav.tableView")}</span>}
          {isSettings && <span className="px-1">{t("nav.settings")}</span>}
          
          {currentProject && (
            <div className="flex items-center gap-0.5 overflow-hidden">
              <span 
                className="truncate px-1 hover:text-foreground cursor-pointer transition-colors"
                onClick={() => router.navigate({ to: "/projects/$projectId", params: { projectId: currentProject.id } })}
              >
                {currentProject.name}
              </span>
              {board && (
                <>
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-30" />
                  <span className="truncate px-1 text-foreground/90 cursor-default font-semibold">{board.name}</span>
                </>
              )}
            </div>
          )}
        </nav>
      </div>

      <div className="topbar-no-drag flex items-center gap-0.5">
        <TooltipProvider delayDuration={500}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6.5 w-6.5 text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors"
                onClick={() => {
                  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">
              <div className="flex items-center gap-2">
                <p>{t("search")}</p>
                <kbd className="rounded border border-border/40 bg-muted/50 px-1 py-0 text-[9px] font-medium text-muted-foreground/60">⌘K</kbd>
              </div>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-6.5 w-6.5 p-0 flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors",
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
                <HardDrive className={cn("h-4 w-4", lastBackup ? "text-primary/40" : "")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px]">
              <p>{backupLabel}</p>
              <p className="text-[10px] opacity-70">{t("backupHint")}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6.5 w-6.5 text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors" 
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">
              <p>{theme === "dark" ? "Light Mode" : "Dark Mode"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6.5 w-6.5 text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors"
                onClick={() => router.navigate({ to: "/settings" })}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">
              <p>{t("nav.settings")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
