import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCreateCard } from "@/hooks/use-cards"
import { DatePicker } from "@/components/card-detail/date-picker"
import { ColorPicker } from "@/components/card-detail/color-picker"
import { TagSelect } from "@/components/card-detail/tag-select"
import { toast } from "sonner"

interface CardCreateDialogProps {
  /** Target column id while the dialog is open; null closes it. */
  columnId: string | null
  onClose: () => void
}

/**
 * Modal card creation. Title + Enter is the fast path; due date / color / tags
 * are optional fields in the same dialog. Created atomically via create_card.
 */
export function CardCreateDialog({ columnId, onClose }: CardCreateDialogProps) {
  const { t } = useTranslation(["board", "common"])
  const createCard = useCreateCard()
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])

  // Reset fields each time the dialog opens for a (new) column.
  useEffect(() => {
    if (columnId) {
      setTitle("")
      setDueDate(null)
      setColor(null)
      setTagIds([])
    }
  }, [columnId])

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed || !columnId) return
    createCard.mutate(
      {
        columnId,
        title: trimmed,
        due_date: dueDate,
        color,
        tag_ids: tagIds.length ? tagIds : undefined,
      },
      { onError: () => toast.error(t("card.createFailed")) },
    )
    onClose()
  }

  return (
    <Dialog open={columnId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("card.newCard")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("card.title")}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                // Enter creates immediately — the fast path needs no other fields.
                if (e.key === "Enter") {
                  e.preventDefault()
                  submit()
                }
              }}
              placeholder={t("card.addPlaceholder")}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("card.dueDate")}</label>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("card.color")}</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("card.tags")}</label>
            <TagSelect value={tagIds} onChange={setTagIds} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common:button.cancel")}</Button>
          <Button onClick={submit} disabled={!title.trim()}>{t("card.add")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
