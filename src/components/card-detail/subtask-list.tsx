import { useTranslation } from "react-i18next"
import { useEffect, useRef, useState } from "react"
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
} from "@/hooks/use-subtasks"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import { attachClosestEdge, extractClosestEdge, type Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Subtask } from "@/lib/tauri"

interface SubtaskListProps {
  cardId: string
}

export function SubtaskList({ cardId }: SubtaskListProps) {
  const { t } = useTranslation("card")
  const { data: subtasks } = useSubtasks(cardId)
  const createSubtask = useCreateSubtask()
  const reorderSubtasks = useReorderSubtasks()
  const [newTitle, setNewTitle] = useState("")

  const handleAdd = () => {
    if (newTitle.trim()) {
      createSubtask.mutate({ cardId, title: newTitle.trim() })
      setNewTitle("")
    }
  }

  const handleReorder = (sourceId: string, targetId: string, edge: Edge | null) => {
    if (!subtasks || sourceId === targetId) return
    const startIndex = subtasks.findIndex((s) => s.id === sourceId)
    const targetIndex = subtasks.findIndex((s) => s.id === targetId)
    if (startIndex === -1 || targetIndex === -1) return

    const reordered = reorderWithEdge({
      list: subtasks,
      startIndex,
      indexOfTarget: targetIndex,
      closestEdgeOfTarget: edge,
      axis: "vertical",
    })
    reorderSubtasks.mutate({ cardId, subtaskIds: reordered.map((s) => s.id) })
  }

  const total = subtasks?.length ?? 0
  const done = subtasks?.filter((s) => s.completed).length ?? 0

  return (
    <div className="space-y-1.5">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {done}/{total}
          </span>
        </div>
      )}

      <div className="space-y-0.5">
        {subtasks?.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onReorder={handleReorder}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t("addSubtask")}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-8 text-sm"
        />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function SubtaskItem({
  subtask,
  onReorder,
}: {
  subtask: Subtask
  onReorder: (sourceId: string, targetId: string, edge: Edge | null) => void
}) {
  const updateSubtask = useUpdateSubtask()
  const deleteSubtask = useDeleteSubtask()

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(subtask.title)
  const [isDragging, setIsDragging] = useState(false)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)

  const rowRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // DnD setup
  useEffect(() => {
    const el = rowRef.current
    const handle = dragHandleRef.current
    if (!el || !handle) return

    return combine(
      draggable({
        element: el,
        dragHandle: handle,
        getInitialData: () => ({ type: "subtask", subtaskId: subtask.id }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) =>
          attachClosestEdge({ type: "subtask", subtaskId: subtask.id }, {
            input,
            element,
            allowedEdges: ["top", "bottom"],
          }),
        canDrop: ({ source }) =>
          source.data.type === "subtask" && source.data.subtaskId !== subtask.id,
        onDragEnter: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source, self }) => {
          setClosestEdge(null)
          const sourceId = source.data.subtaskId as string
          const edge = extractClosestEdge(self.data)
          onReorder(sourceId, subtask.id, edge)
        },
      }),
    )
  }, [subtask.id, onReorder])

  const startEdit = () => {
    setEditValue(subtask.title)
    setEditing(true)
    requestAnimationFrame(() => editInputRef.current?.select())
  }

  const commitEdit = () => {
    setEditing(false)
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== subtask.title) {
      updateSubtask.mutate({ id: subtask.id, title: trimmed })
    }
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditValue(subtask.title)
  }

  return (
    <div className="relative">
      {closestEdge === "top" && (
        <div className="absolute -top-px left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
      <div
        ref={rowRef}
        className={cn(
          "group flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-muted/50 transition-colors",
          isDragging && "opacity-30",
        )}
      >
        <div
          ref={dragHandleRef}
          className="flex shrink-0 cursor-grab items-center opacity-0 group-hover:opacity-60 hover:!opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <input
          type="checkbox"
          checked={subtask.completed}
          onChange={(e) =>
            updateSubtask.mutate({ id: subtask.id, completed: e.target.checked })
          }
          className="h-4 w-4 shrink-0 rounded border-border"
        />

        {editing ? (
          <input
            ref={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit()
              if (e.key === "Escape") cancelEdit()
            }}
            className="flex-1 bg-transparent text-sm outline-none ring-1 ring-primary/40 rounded px-1 py-0.5"
          />
        ) : (
          <span
            onDoubleClick={startEdit}
            className={cn(
              "flex-1 cursor-default select-none rounded px-1 py-0.5 text-sm",
              subtask.completed && "text-muted-foreground line-through",
            )}
          >
            {subtask.title}
          </span>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
          onClick={() => deleteSubtask.mutate(subtask.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {closestEdge === "bottom" && (
        <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </div>
  )
}
