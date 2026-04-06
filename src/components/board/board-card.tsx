import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter"
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview"
import { preserveOffsetOnSource } from "@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source"
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge"
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine"
import { Check, ListChecks, Calendar, Trash2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardMoveMenu } from "./card-move-menu"
import { DeadlineBadge } from "@/components/shared/deadline-badge"
import { useUpdateCard, useDeleteCard, useCloneCard } from "@/hooks/use-cards"
import { useConfirm } from "@/components/shared/prompt-dialog"
import type { CardWithTags } from "@/lib/tauri"
import { Badge } from "@/components/ui/badge"

interface BoardCardProps {
  card: CardWithTags
  columnId: string
  boardId?: string
  onClick?: () => void
}

export function BoardCard({ card, columnId, boardId, onClick }: BoardCardProps) {
  const { t } = useTranslation("board")
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [closestEdge, setClosestEdge] = useState<string | null>(null)
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const cloneCard = useCloneCard()
  const confirm = useConfirm()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ type: "card", cardId: card.id, columnId }),
        onGenerateDragPreview: ({ nativeSetDragImage, location }) => {
          setCustomNativeDragPreview({
            nativeSetDragImage,
            getOffset: preserveOffsetOnSource({ element: el, input: location.current.input }),
            render({ container }) {
              const rect = el.getBoundingClientRect()
              const preview = el.cloneNode(true) as HTMLElement
              Object.assign(preview.style, {
                width: `${rect.width}px`,
                transform: "rotate(2deg) scale(1.02)",
                boxShadow: "0 20px 44px rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.08)",
                borderRadius: "0.75rem",
                opacity: "0.92",
                background: "var(--card)",
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
            { type: "card", cardId: card.id, columnId },
            { input, element, allowedEdges: ["top", "bottom"] },
          ),
        canDrop: ({ source }) => source.data.type === "card" && source.data.cardId !== card.id,
        onDragEnter: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDrag: ({ self }) => {
          setClosestEdge(extractClosestEdge(self.data))
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      }),
    )
  }, [card.id, columnId])

  const hasMetadata = card.due_date || card.tags.length > 0 || card.subtask_total > 0

  return (
    <div className="relative group/card-wrapper">
      {closestEdge === "top" && (
        <div className="absolute -top-1.5 left-1 right-1 z-10 flex flex-col items-center">
          <div className="h-[3px] w-full rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        </div>
      )}
      <div
        ref={ref}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Card: ${card.title}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.() } }}
        className={cn(
          "board-card relative flex flex-col gap-3 cursor-grab rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all duration-200 outline-none",
          "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          isDragging && "opacity-20 border-dashed border-primary/30 bg-primary/[0.04] shadow-none scale-[0.97] [&>*]:opacity-40",
          card.completed && "bg-muted/30 border-dashed"
        )}
      >
        {/* Color stripe */}
        {card.color && (
          <div
            className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full transition-all group-hover/card-wrapper:w-2"
            style={{ backgroundColor: card.color }}
          />
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                updateCard.mutate({ id: card.id, updates: { completed: !card.completed } })
              }}
              className={cn(
                "shrink-0 h-5 w-5 mt-0.5 rounded-md border border-input flex items-center justify-center transition-all hover:scale-110",
                card.completed ? "bg-primary border-primary" : "hover:border-primary",
              )}
            >
              {card.completed && <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3px]" />}
            </button>
            <p className={cn(
              "text-[13.5px] font-semibold leading-[1.4] text-foreground transition-all",
              card.completed && "line-through text-muted-foreground/50 font-normal"
            )}>
              {card.title}
            </p>
          </div>
          {boardId && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover/card-wrapper:opacity-100 transition-opacity">
              <CardMoveMenu cardId={card.id} currentColumnId={columnId} boardId={boardId} />
              <button
                onClick={(e) => { e.stopPropagation(); cloneCard.mutate(card.id) }}
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={t("card.clone")}
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  const ok = await confirm(t("card.deleteConfirm", { name: card.title }))
                  if (ok) deleteCard.mutate(card.id)
                }}
                className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title={t("card.delete")}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {hasMetadata && (
          <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
            {card.due_date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <DeadlineBadge dueDate={card.due_date} />
              </div>
            )}
            
            {card.subtask_total > 0 && (
              <Badge 
                variant="outline" 
                className={cn(
                  "h-5.5 px-2 gap-1.5 text-[10px] font-bold border-muted-foreground/20 transition-colors",
                  card.subtask_done === card.subtask_total 
                    ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400" 
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                <ListChecks className="h-3.5 w-3.5" />
                <span>{card.subtask_done}/{card.subtask_total}</span>
              </Badge>
            )}

            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-auto">
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
        )}
      </div>
      {closestEdge === "bottom" && (
        <div className="absolute -bottom-1.5 left-1 right-1 z-10 flex flex-col items-center">
          <div className="h-[3px] w-full rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
        </div>
      )}
    </div>
  )
}

