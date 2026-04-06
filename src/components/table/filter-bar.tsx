import { useTranslation } from "react-i18next"
import { useProjects } from "@/hooks/use-projects"
import { useAllBoards } from "@/hooks/use-boards"
import { useTags } from "@/hooks/use-tags"
import { STATUS_CATEGORIES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import type { CardFilter } from "@/hooks/use-unified"

interface FilterBarProps {
  filters: CardFilter
  onChange: (filters: CardFilter) => void
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { t } = useTranslation("common")
  const { data: projects } = useProjects()
  const { data: allBoards } = useAllBoards()
  const { data: tags } = useTags()

  const visibleBoards = filters.project_ids?.length
    ? allBoards?.filter((b) => filters.project_ids!.includes(b.project_id))
    : allBoards

  const toggleProject = (id: string) => {
    const current = filters.project_ids ?? []
    const next = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id]
    onChange({ ...filters, project_ids: next.length > 0 ? next : undefined })
  }

  const toggleBoard = (id: string) => {
    const current = filters.board_ids ?? []
    const next = current.includes(id)
      ? current.filter((b) => b !== id)
      : [...current, id]
    onChange({ ...filters, board_ids: next.length > 0 ? next : undefined })
  }

  const toggleStatus = (value: string) => {
    const current = filters.status_categories ?? []
    const next = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value]
    onChange({ ...filters, status_categories: next.length > 0 ? next : undefined })
  }

  const toggleTag = (id: string) => {
    const current = filters.tag_ids ?? []
    const next = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id]
    onChange({ ...filters, tag_ids: next.length > 0 ? next : undefined })
  }

  const hasFilters =
    (filters.project_ids?.length ?? 0) > 0 ||
    (filters.board_ids?.length ?? 0) > 0 ||
    (filters.status_categories?.length ?? 0) > 0 ||
    (filters.tag_ids?.length ?? 0) > 0 ||
    !!filters.due_date_from ||
    !!filters.due_date_to

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
      <span className="text-xs font-medium text-muted-foreground">{t("filters")}</span>

      {projects?.map((p) => (
        <Badge
          key={p.id}
          variant={filters.project_ids?.includes(p.id) ? "default" : "outline"}
          className="cursor-pointer text-xs"
          onClick={() => toggleProject(p.id)}
        >
          <div className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}
        </Badge>
      ))}

      {visibleBoards && visibleBoards.length > 0 && (
        <>
          <span className="text-border">|</span>
          {visibleBoards.map((b) => (
            <Badge
              key={b.id}
              variant={filters.board_ids?.includes(b.id) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleBoard(b.id)}
            >
              {b.name}
            </Badge>
          ))}
        </>
      )}

      <span className="text-border">|</span>

      {STATUS_CATEGORIES.map((s) => (
        <Badge
          key={s.value}
          variant={filters.status_categories?.includes(s.value) ? "default" : "outline"}
          className="cursor-pointer text-xs"
          onClick={() => toggleStatus(s.value)}
        >
          {t(s.label as never)}
        </Badge>
      ))}

      {tags && tags.length > 0 && (
        <>
          <span className="text-border">|</span>
          {tags.map((t) => (
            <Badge
              key={t.id}
              variant={filters.tag_ids?.includes(t.id) ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => toggleTag(t.id)}
            >
              {t.name}
            </Badge>
          ))}
        </>
      )}

      <span className="text-border">|</span>

      <Input
        type="date"
        value={filters.due_date_from ?? ""}
        onChange={(e) => onChange({ ...filters, due_date_from: e.target.value || undefined })}
        className="h-7 w-32 text-xs"
        placeholder={t("from")}
      />
      <span className="text-xs text-muted-foreground">~</span>
      <Input
        type="date"
        value={filters.due_date_to ?? ""}
        onChange={(e) => onChange({ ...filters, due_date_to: e.target.value || undefined })}
        className="h-7 w-32 text-xs"
        placeholder={t("to")}
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => onChange({})}
        >
          <X className="h-3 w-3" />
          {t("button.clear")}
        </Button>
      )}
    </div>
  )
}
