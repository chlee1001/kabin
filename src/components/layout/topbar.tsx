import { Search, PanelLeftClose, PanelLeft, Moon, Sun, HardDrive, Settings } from "lucide-react"
import { useRouter } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppStore } from "@/stores/app-store"
import { useTheme } from "@/components/theme-provider"
import { useLastBackupTime } from "@/hooks/use-backup"
import { formatDistanceToNow, parseISO } from "date-fns"

export function Topbar() {
  const { sidebarOpen, toggleSidebar, sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const { theme, setTheme } = useTheme()
  const { data: lastBackup } = useLastBackupTime()
  const router = useRouter()

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
    ? `Backup: ${formatDistanceToNow(parseISO(lastBackup), { addSuffix: true })}`
    : "No backup yet"

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleSidebar}>
          {sidebarCollapsed || !sidebarOpen ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="outline"
          className="h-8 cursor-pointer gap-2 px-3 text-sm text-muted-foreground"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
          }}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{backupLabel}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{backupLabel}</p>
              <p className="text-xs text-muted-foreground">⌘S to backup now</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={() => router.navigate({ to: "/settings" })}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
