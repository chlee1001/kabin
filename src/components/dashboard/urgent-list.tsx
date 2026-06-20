import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import type { UrgentCard } from "@/hooks/use-dashboard"
import { DeadlineBadge } from "@/components/shared/deadline-badge"
import { cn } from "@/lib/utils"

interface UrgentListProps {
  cards: UrgentCard[]
  onCardClick?: (cardId: string) => void
}

function UrgentRow({
  card,
  onCardClick,
  last,
}: {
  card: UrgentCard
  onCardClick?: (cardId: string) => void
  last: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCardClick?.(card.card_id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onCardClick?.(card.card_id)
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50",
        !last && "border-b border-border",
      )}
    >
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: card.project_color }}
      />
      <span className="flex-1 truncate text-sm">{card.title}</span>
      <span className="text-xs text-muted-foreground">
        {card.board_name} &middot; {card.column_name}
      </span>
      <DeadlineBadge dueDate={card.due_date} />
    </div>
  )
}

function UrgentGroup({
  title,
  tone,
  cards,
  onCardClick,
}: {
  title: string
  tone?: "danger"
  cards: UrgentCard[]
  onCardClick?: (cardId: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1 text-xs font-medium">
        <span className={tone === "danger" ? "text-destructive" : "text-muted-foreground"}>
          {title}
        </span>
        <span className="text-muted-foreground/60">{cards.length}</span>
      </div>
      <div className="rounded-lg border border-border">
        {cards.map((card, i) => (
          <UrgentRow
            key={card.card_id}
            card={card}
            onCardClick={onCardClick}
            last={i === cards.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

export function UrgentList({ cards, onCardClick }: UrgentListProps) {
  const { t } = useTranslation("dashboard")
  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        {t("noUrgentDeadlines")}
      </div>
    )
  }

  // due_date is a date-only "YYYY-MM-DD" string, so a plain string compare with
  // today separates overdue (already past) from upcoming deadlines.
  const today = format(new Date(), "yyyy-MM-dd")
  const overdue = cards.filter((c) => c.due_date < today)
  const upcoming = cards.filter((c) => c.due_date >= today)

  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <UrgentGroup title={t("overdue")} tone="danger" cards={overdue} onCardClick={onCardClick} />
      )}
      {upcoming.length > 0 && (
        <UrgentGroup title={t("upcoming")} cards={upcoming} onCardClick={onCardClick} />
      )}
    </div>
  )
}
