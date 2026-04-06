import { useTranslation } from "react-i18next"
import { useState } from "react"
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from "@/hooks/use-subtasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface SubtaskListProps {
  cardId: string
}

export function SubtaskList({ cardId }: SubtaskListProps) {
  const { t } = useTranslation("card")
  const { data: subtasks } = useSubtasks(cardId)
  const createSubtask = useCreateSubtask()
  const updateSubtask = useUpdateSubtask()
  const deleteSubtask = useDeleteSubtask()
  const [newTitle, setNewTitle] = useState("")

  const handleAdd = () => {
    if (newTitle.trim()) {
      createSubtask.mutate({ cardId, title: newTitle.trim() })
      setNewTitle("")
    }
  }

  const total = subtasks?.length ?? 0
  const done = subtasks?.filter((s) => s.completed).length ?? 0

  return (
    <div className="space-y-2">
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

      {subtasks?.map((subtask) => (
        <div key={subtask.id} className="group flex items-center gap-2">
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={(e) =>
              updateSubtask.mutate({ id: subtask.id, completed: e.target.checked })
            }
            className="h-4 w-4 rounded border-border"
          />
          <span
            className={
              subtask.completed
                ? "flex-1 text-sm text-muted-foreground line-through"
                : "flex-1 text-sm"
            }
          >
            {subtask.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={() => deleteSubtask.mutate(subtask.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

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
