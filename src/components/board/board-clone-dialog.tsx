import { useEffect, useState } from "react"
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
  const [newName, setNewName] = useState(`${boardName} (Copy)`)
  const [includeCards, setIncludeCards] = useState(true)
  const cloneBoard = useCloneBoard(projectId)

  useEffect(() => setNewName(`${boardName} (Copy)`), [boardName])

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
          <DialogTitle>Duplicate Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Board name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Include</Label>
            <div className="flex gap-2">
              <Button
                variant={!includeCards ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeCards(false)}
              >
                Columns only
              </Button>
              <Button
                variant={includeCards ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeCards(true)}
              >
                Columns + Cards
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={!newName.trim() || cloneBoard.isPending}>
            {cloneBoard.isPending ? "Cloning..." : "Duplicate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
