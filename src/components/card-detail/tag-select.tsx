import { useTags } from "@/hooks/use-tags"
import { cn } from "@/lib/utils"

interface TagSelectProps {
  value: string[]
  onChange: (ids: string[]) => void
}

/**
 * Controlled tag selector for the card-create form. Only allows selecting
 * existing tags (no inline creation) so cancelling a create can never leave an
 * orphan tag. Tag creation stays in the card-detail TagPicker.
 */
export function TagSelect({ value, onChange }: TagSelectProps) {
  const { data: allTags } = useTags()

  if (!allTags || allTags.length === 0) return null

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div className="flex flex-wrap gap-1">
      {allTags.map((tag) => {
        const selected = value.includes(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors",
              selected
                ? "border-foreground bg-muted text-foreground"
                : "border-dashed border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
