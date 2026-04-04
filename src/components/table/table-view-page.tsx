import { useState, useMemo } from "react"
import { useFilteredCards, type CardFilter } from "@/hooks/use-unified"
import { useUpdateCard } from "@/hooks/use-cards"
import { STATUS_CATEGORIES } from "@/lib/constants"
import { CardDetailModal } from "@/components/card-detail/card-detail-modal"
import { FilterBar } from "./filter-bar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type SortKey = "title" | "project_name" | "board_name" | "status_category" | "due_date" | "start_date" | "completed"
type SortDir = "asc" | "desc"

export function TableViewPage() {
  const [filters, setFilters] = useState<CardFilter>({})
  const { data: cards, isLoading } = useFilteredCards(filters)
  const [sortKey, setSortKey] = useState<SortKey>("due_date")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const updateCard = useUpdateCard()

  const sorted = useMemo(() => {
    if (!cards) return []
    return [...cards].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [cards, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-3">
        <h1 className="text-xl font-semibold">Table View</h1>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Done</TableHead>
              <SortableHeader label="Project" sortKey="project_name" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Board" sortKey="board_name" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Title" sortKey="title" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Status" sortKey="status_category" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Start Date" sortKey="start_date" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <SortableHeader label="Due Date" sortKey="due_date" current={sortKey} dir={sortDir} onToggle={toggleSort} />
              <TableHead>Subtasks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((card) => (
              <TableRow
                key={card.card_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedCardId(card.card_id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => updateCard.mutate({ id: card.card_id, updates: { completed: !card.completed } })}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border border-border transition-colors",
                      card.completed && "bg-primary border-primary",
                    )}
                  >
                    {card.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: card.project_color }} />
                    <span className="text-sm">{card.project_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{card.board_name}</TableCell>
                <TableCell className={cn("max-w-[300px] truncate text-sm font-medium", card.completed && "line-through opacity-60")}>
                  {card.title}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {STATUS_CATEGORIES.find((s) => s.value === card.status_category)?.label ?? card.status_category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{card.start_date ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{card.due_date ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {card.subtask_total > 0 ? `${card.subtask_done}/${card.subtask_total}` : "—"}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No cards found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
    </div>
  )
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onToggle,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onToggle: (key: SortKey) => void
}) {
  return (
    <TableHead>
      <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1" onClick={() => onToggle(sortKey)}>
        {label}
        <ArrowUpDown className="h-3.5 w-3.5" />
        {current === sortKey && (
          <span className="text-xs">{dir === "asc" ? "↑" : "↓"}</span>
        )}
      </Button>
    </TableHead>
  )
}
