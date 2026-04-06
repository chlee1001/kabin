import { useTranslation } from "react-i18next"
import type { UrgentCard } from "@/hooks/use-dashboard"
import { DeadlineBadge } from "@/components/shared/deadline-badge"

interface UrgentListProps {
  cards: UrgentCard[]
  onCardClick?: (cardId: string) => void
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

  return (
    <div className="rounded-lg border border-border">
      {cards.map((card, i) => (
        <div
          key={card.card_id}
          className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50 ${
            i < cards.length - 1 ? "border-b border-border" : ""
          }`}
          onClick={() => onCardClick?.(card.card_id)}
        >
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: card.project_color }}
          />
          <span className="flex-1 truncate text-sm">{card.title}</span>
          <span className="text-xs text-muted-foreground">{card.board_name} &middot; {card.column_name}</span>
          <DeadlineBadge dueDate={card.due_date} />
        </div>
      ))}
    </div>
  )
}
