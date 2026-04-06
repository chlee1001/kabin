import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCloneBoard } from "@/hooks/use-boards"

interface BoardCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  boardName: string
  projectId: string
}

export function BoardCloneDialog({ open, onOpenChange, boardId, boardName, projectId }: BoardCloneDialogProps) {
  const { t } = useTranslation("board")
  const [newName, setNewName] = useState(t("clone.copy", { name: boardName }))
  const [includeCards, setIncludeCards] = useState(true)
  const cloneBoard = useCloneBoard(projectId)

  useEffect(() => setNewName(t("clone.copy", { name: boardName })), [boardName, t])

  const handleClone = () => {
    cloneBoard.mutate(
      { boardId, newName, includeCards },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("clone.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("clone.boardName")}</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("clone.include")}</Label>
            <div className="flex gap-2">
              <Button
                variant={!includeCards ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeCards(false)}
              >
                {t("clone.columnsOnly")}
              </Button>
              <Button
                variant={includeCards ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeCards(true)}
              >
                {t("clone.columnsAndCards")}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:button.cancel")}
          </Button>
          <Button onClick={handleClone} disabled={!newName.trim() || cloneBoard.isPending}>
            {cloneBoard.isPending ? t("clone.cloning") : t("common:button.duplicate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
