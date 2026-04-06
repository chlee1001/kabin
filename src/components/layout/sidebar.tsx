import { Link, useRouter } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Kanban,
  Table2,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderOpen,
  MoreHorizontal,
  ArrowRightLeft,
  Pencil,
  Trash2,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects"
import { useBoards, useCreateBoard, useUpdateBoard, useDeleteBoard, useMoveBoard } from "@/hooks/use-boards"
import { useAppStore } from "@/stores/app-store"
import { usePrompt, useConfirm } from "@/components/shared/prompt-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { MoveBoardDialog } from "@/components/board/move-board-dialog"
import { InlineEdit } from "@/components/shared/inline-edit"
import { ProjectEditDialog } from "@/components/shared/project-edit-dialog"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

const NAV_ITEMS = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/unified", labelKey: "nav.unifiedKanban", icon: Kanban },
  { to: "/table", labelKey: "nav.tableView", icon: Table2 },
] as const

export function Sidebar() {
  const { t } = useTranslation(["layout", "board", "common"])
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const { data: projects } = useProjects()
  const router = useRouter()

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSidebarCollapsed(e.matches)
    }
    handler(mq)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [setSidebarCollapsed])

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200",
        sidebarCollapsed ? "w-14" : "w-60",
      )}
    >
      <div className="flex h-12 items-center px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-semibold">{t("appName")}</span>
        )}
      </div>

      <Separator />

      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              router.state.location.pathname === to &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>{t(labelKey)}</span>}
          </Link>
        ))}
      </nav>

      <Separator />

      {!sidebarCollapsed && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {t("projects")}
          </span>
          <NewProjectButton />
        </div>
      )}

      <ScrollArea className="flex-1 px-2">
        {projects?.map((project) => (
          <ProjectItem key={project.id} project={project} collapsed={sidebarCollapsed} />
        ))}
      </ScrollArea>

      <Separator />

      <nav className="p-2">
        <Link
          to="/settings"
          className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>{t("nav.settings")}</span>}
        </Link>
      </nav>
    </aside>
  )
}

function NewProjectButton() {
  const { t } = useTranslation(["board", "common"])
  const createProject = useCreateProject()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <ProjectEditDialog
        open={open}
        onOpenChange={setOpen}
        title={t("project.new")}
        onSave={(name, color) => {
          createProject.mutate({ name, color })
          setOpen(false)
        }}
        saving={createProject.isPending}
      />
    </>
  )
}

function ProjectItem({
  project,
  collapsed,
}: {
  project: { id: string; name: string; color: string }
  collapsed: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [movingBoardId, setMovingBoardId] = useState<string | null>(null)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const projectRef = useRef<HTMLDivElement>(null)
  const { data: boards } = useBoards(expanded ? project.id : undefined)
  const createBoard = useCreateBoard()
  const updateBoard = useUpdateBoard(project.id)
  const deleteBoard = useDeleteBoard()
  const moveBoard = useMoveBoard()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const prompt = usePrompt()
  const confirm = useConfirm()
  const { t } = useTranslation(["board", "common"])

  // Make project a drop target for board drags
  useEffect(() => {
    const el = projectRef.current
    if (!el) return
    return dropTargetForElements({
      element: el,
      getData: () => ({ type: "sidebar-project", projectId: project.id }),
      canDrop: ({ source }) =>
        source.data.type === "sidebar-board" && source.data.sourceProjectId !== project.id,
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: ({ source }) => {
        setIsDragOver(false)
        const boardId = source.data.boardId as string
        moveBoard.mutate({ boardId, targetProjectId: project.id })
      },
    })
  }, [project.id, moveBoard])

  const handleNewBoard = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const name = await prompt(t("boardName"))
    if (name) createBoard.mutate({ projectId: project.id, name })
  }

  if (collapsed) {
    return (
      <Link
        to="/projects/$projectId"
        params={{ projectId: project.id }}
        className="flex cursor-pointer items-center justify-center rounded-md p-2 hover:bg-sidebar-accent"
      >
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color }}
        />
      </Link>
    )
  }

  return (
    <div ref={projectRef} className={cn("mb-0.5 rounded-md transition-colors", isDragOver && "bg-primary/10 ring-1 ring-primary/40")}>
      <div className="group flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-sidebar-accent"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <span className="truncate" onClick={(e) => e.stopPropagation()}>
            <InlineEdit
              value={project.name}
              onSave={(name) => updateProject.mutate({ id: project.id, updates: { name } })}
              className="truncate"
            />
          </span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-pointer opacity-0 group-hover:opacity-100"
          onClick={handleNewBoard}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 cursor-pointer opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditProjectOpen(true)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t("common:button.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                const ok = await confirm(t("project.deleteConfirm", { name: project.name }), t("project.deleteDescription"))
                if (ok) deleteProject.mutate(project.id)
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {t("common:button.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && boards?.map((board) => (
        <SidebarBoardItem
          key={board.id}
          board={board}
          projectId={project.id}
          onRename={(name) => updateBoard.mutate({ id: board.id, updates: { name } })}
          onMove={() => setMovingBoardId(board.id)}
          onDelete={async () => {
            const ok = await confirm(t("boardDeleteConfirm", { name: board.name }), t("boardDeleteDescription"))
            if (ok) deleteBoard.mutate(board.id)
          }}
        />
      ))}

      <MoveBoardDialog
        open={!!movingBoardId}
        onOpenChange={(open) => { if (!open) setMovingBoardId(null) }}
        boardId={movingBoardId}
        currentProjectId={project.id}
      />
      <ProjectEditDialog
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        title={t("project.edit")}
        initialName={project.name}
        initialColor={project.color}
        onSave={(name, color) => {
          updateProject.mutate({ id: project.id, updates: { name, color } })
          setEditProjectOpen(false)
        }}
      />
    </div>
  )
}

function SidebarBoardItem({
  board,
  projectId,
  onRename,
  onMove,
  onDelete,
}: {
  board: { id: string; name: string }
  projectId: string
  onRename: (name: string) => void
  onMove: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation(["board", "common"])
  const boardRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    return draggable({
      element: el,
      getInitialData: () => ({ type: "sidebar-board", boardId: board.id, sourceProjectId: projectId }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    })
  }, [board.id, projectId])

  return (
    <div
      ref={boardRef}
      className={cn("group/board flex items-center", isDragging && "opacity-40")}
    >
      <div
        onClick={() => router.navigate({ to: "/boards/$boardId", params: { boardId: board.id } })}
        className="flex flex-1 cursor-grab items-center gap-2 rounded-md py-1.5 pl-10 pr-1 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <FolderOpen className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate" onClick={(e) => e.stopPropagation()}>
          <InlineEdit
            value={board.name}
            onSave={(name) => onRename(name)}
            className="truncate"
          />
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover/board:opacity-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onMove}>
            <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
            {t("moveToProject")}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t("common:button.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
