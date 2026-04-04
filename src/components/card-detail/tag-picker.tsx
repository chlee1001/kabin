import { useState } from "react"
import { useCardTags, useTags, useCreateTag, useAddCardTag, useRemoveCardTag } from "@/hooks/use-tags"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface TagPickerProps {
  cardId: string
}

export function TagPicker({ cardId }: TagPickerProps) {
  const { data: cardTags } = useCardTags(cardId)
  const { data: allTags } = useTags()
  const createTag = useCreateTag()
  const addTag = useAddCardTag()
  const removeTag = useRemoveCardTag()
  const [showInput, setShowInput] = useState(false)
  const [newTagName, setNewTagName] = useState("")

  const availableTags = allTags?.filter(
    (t) => !cardTags?.some((ct) => ct.id === t.id),
  )

  const handleAdd = async () => {
    if (!newTagName.trim()) return

    const existing = allTags?.find(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase(),
    )
    if (existing) {
      addTag.mutate({ cardId, tagId: existing.id })
    } else {
      const tag = await createTag.mutateAsync({ name: newTagName.trim() })
      addTag.mutate({ cardId, tagId: tag.id })
    }
    setNewTagName("")
    setShowInput(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {cardTags?.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 text-xs"
            style={{ borderColor: tag.color }}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <button
              onClick={() => removeTag.mutate({ cardId, tagId: tag.id })}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>

      {availableTags && availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => addTag.mutate({ cardId, tagId: tag.id })}
              className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}

      {showInput ? (
        <div className="flex items-center gap-1">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Tag name..."
            className="h-7 text-xs"
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAdd}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => setShowInput(true)}
        >
          <Plus className="h-3 w-3" />
          New Tag
        </Button>
      )}
    </div>
  )
}
