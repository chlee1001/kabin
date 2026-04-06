import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview"
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source"
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
  const [isCardDragOver, setIsCardDragOver] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [closestColumnEdge, setClosestColumnEdge] = useState<string | null>(null)

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
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: el, input: location.current.input }),
            render({ container }) {
              const rect = el.getBoundingClientRect()
              const preview = el.cloneNode(true) as HTMLElement
              Object.assign(preview.style, {
                width: `${rect.width}px`,
                height: `${Math.min(rect.height, 300)}px`,
                overflow: "hidden",
                transform: "rotate(1.5deg) scale(0.95)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.1)",
                borderRadius: "0.5rem",
                opacity: "0.9",
              })
              container.appendChild(preview)
            },
          })
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
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
        onDragEnter: ({ source, self }) => {
          setIsDragOver(true)
          if (source.data.type === "card" && source.data.columnId !== column.id) {
            setIsCardDragOver(true)
          }
          if (source.data.type === "column" && source.data.columnId !== column.id) {
            setClosestColumnEdge(extractClosestEdge(self.data))
          }
        },
        onDrag: ({ source, self }) => {
          if (source.data.type === "column" && source.data.columnId !== column.id) {
            setClosestColumnEdge(extractClosestEdge(self.data))
          }
        },
        onDragLeave: () => { setIsDragOver(false); setIsCardDragOver(false); setClosestColumnEdge(null) },
        onDrop: ({ source, location }) => {
          setIsDragOver(false)
          setIsCardDragOver(false)
          setClosestColumnEdge(null)
          if (source.data.type !== "card") return
          if (sortBy !== "manual") return

          const cardId = source.data.cardId as string
          const sourceColumnId = source.data.columnId as string

          if (sourceColumnId === column.id) return

          // If dropped on a specific card, let the monitor handle precise positioning
          const cardTarget = location.current.dropTargets.find(
            (dt) => dt.data.type === "card" && dt.data.columnId === column.id,
          )
          if (cardTarget) return

          // Dropped on column empty area → append to end
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

  // Monitor card drops targeting cards in this column (same-column reorder + cross-column insert)
  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) => source.data.type === "card",
      onDrop: ({ source, location }) => {
        if (sortBy !== "manual") return
        // Find a card drop target belonging to THIS column
        const cardTarget = location.current.dropTargets.find(
          (dt) => dt.data.type === "card" && dt.data.columnId === column.id,
        )
        if (!cardTarget) return
        if (!cards) return

        const sourceId = source.data.cardId as string
        const sourceColumnId = source.data.columnId as string
        const targetId = cardTarget.data.cardId as string
        if (sourceId === targetId) return

        const edge = extractClosestEdge(cardTarget.data)

        if (sourceColumnId === column.id) {
          // Same-column reorder
          const reordered = reorderWithEdge({
            list: cards,
            startIndex: cards.findIndex((c) => c.id === sourceId),
            indexOfTarget: cards.findIndex((c) => c.id === targetId),
            closestEdgeOfTarget: edge,
            axis: "vertical",
          })
          reorderCards.mutate(
            { columnId: column.id, cardIds: reordered.map((c) => c.id) },
            { onError: () => toast.error(t("card.reorderFailed")) },
          )
        } else {
          // Cross-column: insert at the precise position
          const currentIds = cards.map((c) => c.id)
          const targetIndex = currentIds.indexOf(targetId)
          if (targetIndex === -1) return
          const insertIndex = edge === "top" ? targetIndex : targetIndex + 1
          const newIds = [...currentIds]
          newIds.splice(insertIndex, 0, sourceId)
          reorderCards.mutate(
            { columnId: column.id, cardIds: newIds },
            { onError: () => toast.error(t("card.moveFailed")) },
          )
        }
      },
    })
  }, [column.id, cards, reorderCards, sortBy])

  const prompt = usePrompt()
  const handleAddCard = async () => {
    const title = await prompt(t("card.title"))
    if (title) createCard.mutate({ columnId: column.id, title })
  }

  return (
    <div className="relative shrink-0 h-full">
      {closestColumnEdge === "left" && (
        <div className="absolute -left-2.5 top-0 bottom-0 z-10 flex items-stretch">
          <div className="w-[3px] rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        </div>
      )}
    <div
      ref={columnRef}
      role="region"
      aria-label={`Column: ${column.name}`}
      className={cn(
        "board-column flex w-72 h-full min-h-0 flex-col rounded-lg bg-muted/40 transition-all duration-200",
        isDragOver && "ring-2 ring-primary/50 bg-primary/[0.06]",
        isCardDragOver && "ring-2 ring-primary/60 bg-primary/[0.08] scale-[1.01]",
        isDragging && "opacity-25 border-2 border-dashed border-primary/30 bg-primary/[0.04] shadow-none [&>*]:opacity-40",
      )}
    >
      <ColumnHeader
        ref={headerRef}
        column={column}
        cardCount={cards?.length ?? 0}
        onAddCard={handleAddCard}
      />
      <div className="flex flex-1 min-h-0 flex-col gap-1.5 overflow-y-auto p-2">
        {sortedCards?.map((card) => (
          <BoardCard key={card.id} card={card} columnId={column.id} boardId={boardId} onClick={() => onCardClick?.(card.id)} />
        ))}
        {isCardDragOver && (
          <div className="mx-1 h-10 rounded-lg border-2 border-dashed border-primary/40 bg-primary/[0.06] flex items-center justify-center transition-all animate-in fade-in duration-200">
            <span className="text-[11px] text-primary/60 font-medium">{t("card.dropHere", "여기에 놓기")}</span>
          </div>
        )}
        {(!sortedCards || sortedCards.length === 0) && !isCardDragOver && (
          <div className="flex flex-1 min-h-[120px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/15 text-muted-foreground/40 text-xs">
            {t("column.empty", "카드 없음")}
          </div>
        )}
      </div>
    </div>
      {closestColumnEdge === "right" && (
        <div className="absolute -right-2.5 top-0 bottom-0 z-10 flex items-stretch">
          <div className="w-[3px] rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        </div>
      )}
    </div>
  )
}
