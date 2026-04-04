import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { STATUS_CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { StatusCategory } from "@/lib/tauri"

interface ColumnEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  initialName?: string
  initialStatus?: StatusCategory
  onSave: (name: string, status: StatusCategory) => void
  saving?: boolean
}

export function ColumnEditDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  initialStatus = "other",
  onSave,
  saving,
}: ColumnEditDialogProps) {
  const [name, setName] = useState(initialName)
  const [status, setStatus] = useState<StatusCategory>(initialStatus)

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), status)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="Column name..."
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setStatus(cat.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    status === cat.value
                      ? "bg-accent text-accent-foreground ring-1 ring-primary/30"
                      : "hover:bg-muted",
                  )}
                >
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
