import { useParams } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { useColumns, useCreateColumn, useReorderColumns } from "@/hooks/use-columns"
import { useBoard, useUpdateBoard } from "@/hooks/use-boards"
import { useProjects, useUpdateProject } from "@/hooks/use-projects"
import React, { useEffect, useRef, useState } from "react"
import { ColumnEditDialog } from "./column-edit-dialog"
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge"
import { BoardColumn } from "./board-column"
import { BoardBackgroundPicker } from "./board-background-picker"
import { BoardCloneDialog } from "./board-clone-dialog"
import { TemplatePanel } from "./template-panel"
import { CardDetailModal } from "@/components/card-detail/card-detail-modal"
import { InlineEdit } from "@/components/shared/inline-edit"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select } from "@/components/ui/select"
import { Copy, Plus, ChevronRight, MoreHorizontal } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { convertFileSrc } from "@tauri-apps/api/core"
import { cn } from "@/lib/utils"

type SortBy = "manual" | "due_date" | "title" | "created_at"
type SortDir = "asc" | "desc"

export function BoardDetailPage() {
  const { t } = useTranslation(["board", "common"])
  const { boardId } = useParams({ from: "/boards/$boardId" })
  const { data: board } = useBoard(boardId)
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === board?.project_id)
  const updateBoard = useUpdateBoard(board?.project_id)
  const updateProject = useUpdateProject()
  const { data: columns, isLoading } = useColumns(boardId)
  const createColumn = useCreateColumn()
  const reorderColumns = useReorderColumns()
  const ref = useRef<HTMLDivElement>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>("manual")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [addColumnOpen, setAddColumnOpen] = useState(false)

  const bgStyle: React.CSSProperties | undefined =
    board?.background_type === "gradient"
      ? { backgroundImage: board.background_value ?? undefined }
      : board?.background_type === "image" && board.background_value
      ? {
          backgroundImage: `url(${convertFileSrc(board.background_value)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : undefined

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const target = location.current.dropTargets[0]
        if (!target) return

        const sourceData = source.data
        const targetData = target.data

        if (sourceData.type === "card" && targetData.type === "column") {
          // Card drops are handled in BoardColumn
          return
        }

        if (sourceData.type === "column" && targetData.type === "column" && columns) {
          const sourceId = sourceData.columnId as string
          const targetId = targetData.columnId as string
          if (sourceId === targetId) return

          const edge = extractClosestEdge(targetData)
          const reordered = reorderWithEdge({
            list: columns,
            startIndex: columns.findIndex((c) => c.id === sourceId),
            indexOfTarget: columns.findIndex((c) => c.id === targetId),
            closestEdgeOfTarget: edge,
            axis: "horizontal",
          })

          reorderColumns.mutate(
            { boardId, columnIds: reordered.map((c) => c.id) },
            {
              onError: () => toast.error(t("columnReorderFailed")),
            },
          )
        }
      },
    })
  }, [columns, boardId, reorderColumns])

  const handleAddColumn = () => setAddColumnOpen(true)

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">{t("common:loading")}</div>
  }

  return (
    <div className={cn("flex h-full flex-col transition-all duration-500", bgStyle && "has-background")} style={bgStyle}>
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="dnd-live" />
      <div className="board-toolbar">
      {board && (
        <div className="flex items-center gap-1.5 px-4 pt-4 pb-1 text-sm">
          {project && (
            <>
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
              </Link>
              <InlineEdit
                value={project.name}
                onSave={(name) => updateProject.mutate({ id: project.id, updates: { name } })}
                className="text-muted-foreground"
              />
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </>
          )}
          <InlineEdit
            value={board.name}
            onSave={(name) => updateBoard.mutate({ id: board.id, updates: { name } })}
            className="font-medium"
            trigger="click"
          />
        </div>
      )}
      <div className="flex items-center gap-2 px-4 pb-2 pt-2">
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="w-36 h-8 text-xs"
        >
          <option value="manual">{t("sort.manual")}</option>
          <option value="due_date">{t("sort.dueDate")}</option>
          <option value="title">{t("sort.title")}</option>
          <option value="created_at">{t("sort.created")}</option>
        </Select>
        {sortBy !== "manual" && (
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        )}

        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleAddColumn}>
          <Plus className="h-3.5 w-3.5" />
          {t("addColumn")}
        </Button>

        <div className="flex-1" />

        {board && (
          <>
            <TemplatePanel boardId={boardId} />
            <BoardBackgroundPicker boardId={boardId} projectId={board.project_id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCloneDialogOpen(true)}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  {t("duplicateBoard")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      </div>
      <div ref={ref} className="board-scroll flex flex-1 gap-4 overflow-x-auto p-4 pt-2">
        {columns?.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            boardId={boardId}
            onCardClick={setSelectedCardId}
            sortBy={sortBy}
            sortDir={sortDir}
          />
        ))}
        <div className="shrink-0 w-4" />
      </div>
      <ColumnEditDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        title={t("column.new")}
        onSave={(name, status) => {
          createColumn.mutate({ boardId, name, statusCategory: status })
          setAddColumnOpen(false)
        }}
        saving={createColumn.isPending}
      />
      <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
      {board && (
        <BoardCloneDialog
          open={cloneDialogOpen}
          onOpenChange={setCloneDialogOpen}
          boardId={boardId}
          boardName={board.name}
          projectId={board.project_id}
        />
      )}
    </div>
  )
}
