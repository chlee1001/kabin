import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useProjects } from "@/hooks/use-projects"
import { useAllBoards } from "@/hooks/use-boards"
import { useTags } from "@/hooks/use-tags"
import { STATUS_CATEGORIES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronDown, X, Search, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardFilter } from "@/hooks/use-unified"

type ArrayFilterKey = "project_ids" | "board_ids" | "status_categories" | "tag_ids"

interface FilterBarProps {
  filters: CardFilter
  onChange: (filters: CardFilter) => void
}

interface FilterOption {
  value: string
  label: string
  color?: string
}

function FilterPopover({
  label,
  options,
  selected,
  onToggle,
  placeholder,
  emptyText,
}: {
  label: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  placeholder?: string
  emptyText: string
}) {
  const [open, setOpen] = useState(false)
  const count = selected.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 border-dashed text-xs font-normal",
            count > 0 && "border-primary/50 bg-primary/5",
          )}
        >
          {label}
          {count > 0 && (
            <Badge
              variant="secondary"
              className="ml-0.5 h-4 min-w-4 rounded px-1 text-[10px] font-medium"
            >
              {count}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          {options.length > 5 && <CommandInput placeholder={placeholder} className="h-9" />}
          <CommandList>
            <CommandEmpty className="py-4 text-xs">{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = selected.includes(opt.value)
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => onToggle(opt.value)}
                    className="gap-2 text-xs"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border",
                        isSelected && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    {opt.color && (
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { t } = useTranslation("common")
  const { data: projects } = useProjects()
  const { data: allBoards } = useAllBoards()
  const { data: tags } = useTags()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Listen for F key focus event
  useEffect(() => {
    const handler = () => searchInputRef.current?.focus()
    window.addEventListener("kanban:focus-filter", handler)
    return () => window.removeEventListener("kanban:focus-filter", handler)
  }, [])

  const visibleBoards = filters.project_ids?.length
    ? allBoards?.filter((b) => filters.project_ids!.includes(b.project_id))
    : allBoards

  const toggle = (field: ArrayFilterKey, value: string) => {
    const current = filters[field] ?? []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    const updated = { ...filters, [field]: next.length > 0 ? next : undefined }

    // Prune board_ids that no longer belong to selected projects
    if (field === "project_ids" && updated.board_ids?.length && allBoards) {
      const validBoardIds = allBoards
        .filter((b) => !updated.project_ids?.length || updated.project_ids.includes(b.project_id))
        .map((b) => b.id)
      const pruned = updated.board_ids.filter((id) => validBoardIds.includes(id))
      updated.board_ids = pruned.length > 0 ? pruned : undefined
    }

    onChange(updated)
  }

  const removeFilter = (field: ArrayFilterKey, value: string) => {
    const current = filters[field] ?? []
    const next = current.filter((v) => v !== value)
    onChange({ ...filters, [field]: next.length > 0 ? next : undefined })
  }

  const projectOptions: FilterOption[] =
    projects?.map((p) => ({ value: p.id, label: p.name, color: p.color })) ?? []

  const boardOptions: FilterOption[] =
    visibleBoards?.map((b) => ({ value: b.id, label: b.name })) ?? []

  const statusOptions: FilterOption[] = STATUS_CATEGORIES.map((s) => ({
    value: s.value,
    label: t(s.label as never),
    color: s.color,
  }))

  const tagOptions: FilterOption[] =
    tags?.map((tg) => ({ value: tg.id, label: tg.name })) ?? []

  const hasFilters =
    (filters.project_ids?.length ?? 0) > 0 ||
    (filters.board_ids?.length ?? 0) > 0 ||
    (filters.status_categories?.length ?? 0) > 0 ||
    (filters.tag_ids?.length ?? 0) > 0 ||
    !!filters.due_date_from ||
    !!filters.due_date_to ||
    !!filters.search

  // Collect active filter chips for display
  const activeChips: { key: string; label: string; field: ArrayFilterKey; value: string; color?: string }[] = []

  for (const id of filters.project_ids ?? []) {
    const p = projects?.find((pr) => pr.id === id)
    if (p) activeChips.push({ key: `p-${id}`, label: p.name, field: "project_ids", value: id, color: p.color })
  }
  for (const id of filters.board_ids ?? []) {
    const b = allBoards?.find((bd) => bd.id === id)
    if (b) activeChips.push({ key: `b-${id}`, label: b.name, field: "board_ids", value: id })
  }
  for (const val of filters.status_categories ?? []) {
    const s = STATUS_CATEGORIES.find((sc) => sc.value === val)
    if (s) activeChips.push({ key: `s-${val}`, label: t(s.label as never), field: "status_categories", value: val, color: s.color })
  }
  for (const id of filters.tag_ids ?? []) {
    const tg = tags?.find((tag) => tag.id === id)
    if (tg) activeChips.push({ key: `t-${id}`, label: tg.name, field: "tag_ids", value: id })
  }

  return (
    <div className="border-b border-border px-4 py-2 space-y-2">
      {/* Trigger row */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterPopover
          label={t("filter.project")}
          options={projectOptions}
          selected={filters.project_ids ?? []}
          onToggle={(v) => toggle("project_ids", v)}
          placeholder={t("filter.search")}
          emptyText={t("filter.noResults")}
        />

        {boardOptions.length > 0 && (
          <FilterPopover
            label={t("filter.board")}
            options={boardOptions}
            selected={filters.board_ids ?? []}
            onToggle={(v) => toggle("board_ids", v)}
            placeholder={t("filter.search")}
            emptyText={t("filter.noResults")}
          />
        )}

        <FilterPopover
          label={t("filter.status")}
          options={statusOptions}
          selected={filters.status_categories ?? []}
          onToggle={(v) => toggle("status_categories", v)}
          emptyText={t("filter.noResults")}
        />

        {tagOptions.length > 0 && (
          <FilterPopover
            label={t("filter.tags")}
            options={tagOptions}
            selected={filters.tag_ids ?? []}
            onToggle={(v) => toggle("tag_ids", v)}
            placeholder={t("filter.search")}
            emptyText={t("filter.noResults")}
          />
        )}

        {/* Date range popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5 border-dashed text-xs font-normal",
                (filters.due_date_from || filters.due_date_to) && "border-primary/50 bg-primary/5",
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {t("filter.dueDate")}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto space-y-3 p-3" align="start">
            <div className="space-y-1.5">
              <label htmlFor="filter-date-from" className="text-xs font-medium text-muted-foreground">{t("from")}</label>
              <Input
                id="filter-date-from"
                type="date"
                value={filters.due_date_from ?? ""}
                onChange={(e) => onChange({ ...filters, due_date_from: e.target.value || undefined })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="filter-date-to" className="text-xs font-medium text-muted-foreground">{t("to")}</label>
              <Input
                id="filter-date-to"
                type="date"
                value={filters.due_date_to ?? ""}
                onChange={(e) => onChange({ ...filters, due_date_to: e.target.value || undefined })}
                className="h-8 text-xs"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
            placeholder={t("filter.search")}
            className="h-8 w-44 pl-8 text-xs"
          />
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange({})}
          >
            <X className="h-3.5 w-3.5" />
            {t("filter.clearAll")}
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="secondary"
              className="gap-1 py-0.5 pl-2 pr-1 text-xs font-normal"
            >
              {chip.color && (
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: chip.color }}
                />
              )}
              {chip.label}
              <button
                onClick={() => removeFilter(chip.field, chip.value)}
                aria-label={`${t("button.remove")} ${chip.label}`}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
