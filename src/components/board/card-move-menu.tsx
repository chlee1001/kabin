import { useColumns } from "@/hooks/use-columns"
import { useMoveCard } from "@/hooks/use-cards"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoveHorizontal } from "lucide-react"
import { toast } from "sonner"

interface CardMoveMenuProps {
  cardId: string
  currentColumnId: string
  boardId: string
}

export function CardMoveMenu({ cardId, currentColumnId, boardId }: CardMoveMenuProps) {
  const { data: columns } = useColumns(boardId)
  const moveCard = useMoveCard()

  const otherColumns = columns?.filter((c) => c.id !== currentColumnId) ?? []

  if (otherColumns.length === 0) return null

  const handleMove = (targetColumnId: string, columnName: string) => {
    moveCard.mutate(
      { cardId, targetColumnId, position: 0 },
      {
        onSuccess: () => {
          const liveEl = document.getElementById("dnd-live")
          if (liveEl) liveEl.textContent = `Card moved to ${columnName}`
        },
        onError: () =>
          toast.error("Card move failed", {
            action: {
              label: "Retry",
              onClick: () => handleMove(targetColumnId, columnName),
            },
          }),
      },
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Move card to another column"
        >
          <MoveHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherColumns.map((col) => (
          <DropdownMenuItem
            key={col.id}
            onClick={(e) => {
              e.stopPropagation()
              handleMove(col.id, col.name)
            }}
          >
            Move to {col.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
