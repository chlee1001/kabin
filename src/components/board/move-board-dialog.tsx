import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useProjects } from "@/hooks/use-projects"
import { useMoveBoard } from "@/hooks/use-boards"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface MoveBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string | null
  currentProjectId: string
}

export function MoveBoardDialog({
  open,
  onOpenChange,
  boardId,
  currentProjectId,
}: MoveBoardDialogProps) {
  const { t } = useTranslation("board")
  const { data: projects } = useProjects()
  const moveBoard = useMoveBoard()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const availableProjects = projects?.filter((p) => p.id !== currentProjectId) ?? []

  const handleMove = () => {
    if (!boardId || !selectedProjectId) return
    moveBoard.mutate(
      { boardId, targetProjectId: selectedProjectId },
      {
        onSuccess: () => {
          toast.success(t("boardMoved"))
          setSelectedProjectId(null)
          onOpenChange(false)
        },
        onError: (err) => toast.error(t("moveFailed", { error: String(err) })),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("moveToProject")}</DialogTitle>
        </DialogHeader>

        {availableProjects.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{t("noOtherProjects")}</p>
        ) : (
          <div className="flex flex-col gap-1 py-2">
            {availableProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  selectedProjectId === project.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                {project.name}
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:button.cancel")}
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedProjectId || moveBoard.isPending}
          >
            {moveBoard.isPending ? t("moving") : t("common:button.move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
