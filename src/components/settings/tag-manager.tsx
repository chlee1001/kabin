import { useState, useRef } from "react"
import { useTags, useUpdateTag, useDeleteTag } from "@/hooks/use-tags"
import { useConfirm } from "@/components/shared/prompt-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"

export function TagManager() {
  const { data: tags } = useTags()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()
  const confirm = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const colorInputRef = useRef<HTMLInputElement>(null)

  const startEdit = (tag: { id: string; name: string; color: string }) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditColor("")
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return
    updateTag.mutate(
      { id: editingId, name: editName.trim(), color: editColor },
      {
        onSuccess: () => {
          cancelEdit()
          toast.success("Tag updated")
        },
        onError: (err) => toast.error(`Update failed: ${err}`),
      },
    )
  }

  const handleDelete = async (tag: { id: string; name: string }) => {
    const ok = await confirm(
      `Delete tag "${tag.name}"?`,
      "This tag will be removed from all cards.",
    )
    if (ok) {
      deleteTag.mutate(tag.id, {
        onSuccess: () => toast.success("Tag deleted"),
        onError: (err) => toast.error(`Delete failed: ${err}`),
      })
    }
  }

  if (!tags || tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tags yet. Tags are created when you add them to cards.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center gap-2 rounded-md px-2 py-1.5"
        >
          {editingId === tag.id ? (
            <>
              <button
                className="h-5 w-5 shrink-0 rounded-full border border-border cursor-pointer"
                style={{ backgroundColor: editColor }}
                onClick={() => colorInputRef.current?.click()}
              />
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
              />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit()
                  if (e.key === "Escape") cancelEdit()
                }}
                className="h-7 flex-1 text-sm"
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <>
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="flex-1 text-sm">{tag.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => startEdit(tag)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleDelete(tag)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
