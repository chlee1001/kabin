import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCreateCard } from "@/hooks/use-cards"
import { DatePicker } from "@/components/card-detail/date-picker"
import { ColorPicker } from "@/components/card-detail/color-picker"
import { TagSelect } from "@/components/card-detail/tag-select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CardQuickAddProps {
  columnId: string
}

/**
 * Inline quick-add form at the bottom of a column. Title + Enter is the fast
 * path; the chevron reveals optional due date / color / tags. Created atomically
 * via create_card so all fields land in one round trip.
 */
export function CardQuickAdd({ columnId }: CardQuickAddProps) {
  const { t } = useTranslation("board")
  const createCard = useCreateCard()
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [showOptions, setShowOptions] = useState(false)

  // Column "+" button and the N / ⌘N shortcut focus this form via a targeted event.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ columnId: string }>).detail
      if (detail?.columnId !== columnId) return
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ block: "nearest" })
    }
    window.addEventListener("kanban:quick-add", handler)
    return () => window.removeEventListener("kanban:quick-add", handler)
  }, [columnId])

  const reset = () => {
    setTitle("")
    setDueDate(null)
    setColor(null)
    setTagIds([])
    setShowOptions(false)
  }

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
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
    reset()
    // Keep focus so several cards can be added in a row.
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="shrink-0 rounded-lg border border-dashed border-border/60 bg-background/40 p-1.5">
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              submit()
            }
            if (e.key === "Escape") {
              reset()
              inputRef.current?.blur()
            }
          }}
          placeholder={t("card.addPlaceholder")}
          className="h-8 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 shrink-0", showOptions && "text-foreground")}
          onClick={() => setShowOptions((v) => !v)}
          title={t("card.moreOptions")}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showOptions && "rotate-180")} />
        </Button>
      </div>

      {showOptions && (
        <div className="space-y-2 p-1.5 pt-2">
          <div>
            <span className="mb-1 block text-[10px] text-muted-foreground">{t("card.dueDate")}</span>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </div>
          <div>
            <span className="mb-1 block text-[10px] text-muted-foreground">{t("card.color")}</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div>
            <span className="mb-1 block text-[10px] text-muted-foreground">{t("card.tags")}</span>
            <TagSelect value={tagIds} onChange={setTagIds} />
          </div>
          <Button
            size="sm"
            className="h-7 w-full gap-1 text-xs"
            onClick={submit}
            disabled={!title.trim()}
          >
            <Plus className="h-3 w-3" />
            {t("card.add")}
          </Button>
        </div>
      )}
    </div>
  )
}
