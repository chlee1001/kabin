import { useTranslation } from "react-i18next"
import { useState } from "react"
import { useFilteredCards, useMoveCardByStatus, type CardFilter } from "@/hooks/use-unified"
import { useUpdateCard } from "@/hooks/use-cards"
import { STATUS_CATEGORIES } from "@/lib/constants"
import { FilterBar } from "@/components/table/filter-bar"
import { CardDetailModal } from "@/components/card-detail/card-detail-modal"
import { DeadlineBadge } from "@/components/shared/deadline-badge"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { UnifiedCard } from "@/hooks/use-unified"

export function UnifiedKanbanPage() {
  const { t } = useTranslation(["board", "common"])
  const [filters, setFilters] = useState<CardFilter>({})
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const { data: cards, isLoading } = useFilteredCards(filters)
  const moveCard = useMoveCardByStatus()

  const cardsByCategory = STATUS_CATEGORIES.map((cat) => ({
    ...cat,
    cards: cards?.filter((c) => c.status_category === cat.value) ?? [],
  }))

  const handleDrop = (cardId: string, sourceStatus: string, targetStatus: string) => {
    if (sourceStatus === targetStatus) return
    const card = cards?.find((c) => c.card_id === cardId)
    const targetLabel = t(`common:${STATUS_CATEGORIES.find((s) => s.value === targetStatus)?.label ?? targetStatus}` as never)

    moveCard.mutate(
      { cardId, targetStatus },
      {
        onSuccess: () => {
          if (card) {
            toast.success(t("unified.cardMovedDetail", { card: card.title, label: targetLabel }))
          }
        },
        onError: (err) => {
          const msg = String(err)
          if (msg.includes("해당 상태 컬럼이 없습니다")) {
            toast.error(t("unified.noStatusColumnDetail", {
              card: card?.title ?? "",
              project: card?.project_name ?? "",
              board: card?.board_name ?? "",
            }))
          } else {
            toast.error(t("unified.moveFailed", { error: msg }))
          }
        },
      },
    )
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">{t("common:loading")}</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-3">
        <h1 className="text-xl font-semibold">{t("unified.title")}</h1>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />

      <div aria-live="polite" aria-atomic="true" className="sr-only" id="dnd-live" />

      <div className="flex flex-1 gap-4 overflow-x-auto p-4 snap-x snap-mandatory md:snap-none">
        {cardsByCategory.map((col) => (
          <StatusColumn
            key={col.value}
            label={col.label}
            value={col.value}
            color={col.color}
            cards={col.cards}
            onDrop={handleDrop}
            onCardClick={setSelectedCardId}
          />
        ))}
      </div>
      <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
    </div>
  )
}

function StatusColumn({
  label,
  value,
  color,
  cards,
  onDrop,
  onCardClick,
}: {
  label: string
  value: string
  color: string
  cards: UnifiedCard[]
  onDrop: (cardId: string, sourceStatus: string, targetStatus: string) => void
  onCardClick: (cardId: string) => void
}) {
  const { t } = useTranslation(["board", "common"])
  const [isDragOver, setIsDragOver] = useState(false)

  return (
    <div
      role="region"
      aria-label={`${t(`common:${label}` as never)} column, ${cards.length} cards`}
      className={cn(
        "flex w-72 shrink-0 snap-center flex-col rounded-lg bg-muted/50 transition-colors md:snap-align-none",
        isDragOver && "ring-2 ring-primary/50 bg-primary/5",
      )}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        setIsDragOver(true)
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false)
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        const cardId = e.dataTransfer.getData("cardId")
        const sourceStatus = e.dataTransfer.getData("sourceStatus")
        if (cardId) {
          onDrop(cardId, sourceStatus, value)
          const liveEl = document.getElementById("dnd-live")
          if (liveEl) liveEl.textContent = t("unified.cardMoved", { label: t(`common:${label}` as never) })
        }
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium">{t(`common:${label}` as never)}</span>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>
      <CardList cards={cards} onCardClick={onCardClick} />
    </div>
  )
}

function CardList({ cards, onCardClick }: { cards: UnifiedCard[]; onCardClick: (cardId: string) => void }) {
  const { t } = useTranslation(["board", "common"])

  if (cards.length === 0) {
    return (
      <div className="flex-1 py-8 text-center text-xs text-muted-foreground">
        {t("unified.noCards")}
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
      {cards.map((card) => (
        <UnifiedCardItem key={card.card_id} card={card} onClick={() => onCardClick(card.card_id)} />
      ))}
    </div>
  )
}

function UnifiedCardItem({ card, onClick }: { card: UnifiedCard; onClick?: () => void }) {
  const updateCard = useUpdateCard()

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("cardId", card.card_id)
        e.dataTransfer.setData("sourceStatus", card.status_category)
        e.dataTransfer.effectAllowed = "move"
        const el = e.currentTarget
        const clone = el.cloneNode(true) as HTMLElement
        Object.assign(clone.style, {
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: `${el.offsetWidth}px`,
          transform: "rotate(2deg) scale(1.02)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
          opacity: "0.92",
          zIndex: "9999",
        })
        document.body.appendChild(clone)
        e.dataTransfer.setDragImage(clone, el.offsetWidth / 2, 20)
        requestAnimationFrame(() => clone.remove())
      }}
      onClick={onClick}
      className="relative cursor-grab rounded-md border border-border bg-card p-3 shadow-sm hover:shadow-md active:opacity-70"
    >
      <div
        className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
        style={{ backgroundColor: card.project_color }}
      />
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            updateCard.mutate({ id: card.card_id, updates: { completed: !card.completed } })
          }}
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border",
            card.completed && "bg-primary border-primary",
          )}
        >
          {card.completed && <Check className="h-3 w-3 text-primary-foreground" />}
        </button>
        <p className={cn("text-sm font-medium leading-snug line-clamp-3", card.completed && "line-through opacity-60")}>
          {card.title}
        </p>
      </div>
      <div className="ml-6 mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{card.project_name} / {card.board_name}</span>
        {card.subtask_total > 0 && (
          <span className="text-xs text-muted-foreground">
            {card.subtask_done}/{card.subtask_total}
          </span>
        )}
        {card.due_date && <DeadlineBadge dueDate={card.due_date} />}
      </div>
      {card.tags.length > 0 && (
        <div className="ml-6 mt-1.5 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none"
              style={{
                backgroundColor: tag.color + "18",
                color: tag.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
