import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { attachClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import { useCardsEnriched, useCreateCard, useReorderCards } from "@/hooks/use-cards"
import { usePrompt } from "@/components/shared/prompt-dialog"
import { BoardCard } from "./board-card"
import { ColumnHeader } from "./column-header"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Column } from "@/lib/tauri"
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge"
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"

interface BoardColumnProps {
  column: Column
  boardId: string
  onCardClick?: (cardId: string) => void
  sortBy?: "manual" | "due_date" | "title" | "created_at"
  sortDir?: "asc" | "desc"
}

export function BoardColumn({ column, boardId, onCardClick, sortBy = "manual", sortDir = "asc" }: BoardColumnProps) {
  const { t } = useTranslation("board")
  const { data: cards } = useCardsEnriched(column.id)
  const createCard = useCreateCard()
  const reorderCards = useReorderCards()
  const columnRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const sortedCards = useMemo(() => {
    if (!cards || sortBy === "manual") return cards
    return [...cards].sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case "due_date":
          if (!a.due_date && !b.due_date) cmp = 0
          else if (!a.due_date) cmp = 1
          else if (!b.due_date) cmp = -1
          else cmp = a.due_date.localeCompare(b.due_date)
          break
        case "title":
          cmp = a.title.localeCompare(b.title)
          break
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at)
          break
      }
      return sortDir === "desc" ? -cmp : cmp
    })
  }, [cards, sortBy, sortDir])

  useEffect(() => {
    const el = columnRef.current
    const handle = headerRef.current
    if (!el || !handle) return

    return combine(
      draggable({
        element: el,
        dragHandle: handle,
        getInitialData: () => ({ type: "column", columnId: column.id }),
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { type: "column", columnId: column.id },
            { input, element, allowedEdges: ["left", "right"] },
          ),
        canDrop: ({ source }) =>
          source.data.type === "card" || source.data.type === "column",
        onDragEnter: () => setIsDragOver(true),
        onDragLeave: () => setIsDragOver(false),
        onDrop: ({ source }) => {
          setIsDragOver(false)
          if (source.data.type !== "card") return
          if (sortBy !== "manual") return

          const cardId = source.data.cardId as string
          const sourceColumnId = source.data.columnId as string

          if (sourceColumnId === column.id) return

          // Move card to this column (append to end)
          const currentIds = cards?.map((c) => c.id) ?? []
          reorderCards.mutate(
            { columnId: column.id, cardIds: [...currentIds, cardId] },
            {
              onError: () => toast.error(t("card.moveFailed")),
            },
          )
        },
      }),
    )
  }, [column.id, cards, reorderCards, sortBy])

  // Monitor card reordering within this column
  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) =>
        source.data.type === "card" && source.data.columnId === column.id,
      onDrop: ({ source, location }) => {
        if (sortBy !== "manual") return
        const target = location.current.dropTargets[0]
        if (!target || target.data.type !== "card") return
        if (!cards) return

        const sourceId = source.data.cardId as string
        const targetId = target.data.cardId as string
        if (sourceId === targetId) return

        const edge = extractClosestEdge(target.data)
        const reordered = reorderWithEdge({
          list: cards,
          startIndex: cards.findIndex((c) => c.id === sourceId),
          indexOfTarget: cards.findIndex((c) => c.id === targetId),
          closestEdgeOfTarget: edge,
          axis: "vertical",
        })

        reorderCards.mutate(
          { columnId: column.id, cardIds: reordered.map((c) => c.id) },
          {
            onError: () => toast.error(t("card.reorderFailed")),
          },
        )
      },
    })
  }, [column.id, cards, reorderCards, sortBy])

  const prompt = usePrompt()
  const handleAddCard = async () => {
    const title = await prompt(t("card.title"))
    if (title) createCard.mutate({ columnId: column.id, title })
  }

  return (
    <div
      ref={columnRef}
      role="region"
      aria-label={`Column: ${column.name}`}
      className={cn(
        "board-column flex w-72 shrink-0 flex-col rounded-lg bg-muted/40",
        isDragOver && "ring-2 ring-primary/50 bg-primary-subtle/20",
      )}
    >
      <ColumnHeader
        ref={headerRef}
        column={column}
        cardCount={cards?.length ?? 0}
        onAddCard={handleAddCard}
      />
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-2">
        {sortedCards?.map((card) => (
          <BoardCard key={card.id} card={card} columnId={column.id} boardId={boardId} onClick={() => onCardClick?.(card.id)} />
        ))}
      </div>
    </div>
  )
}
