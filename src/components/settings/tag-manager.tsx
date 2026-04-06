import { useTranslation } from "react-i18next"
import { useState, useRef } from "react"
import { useTags, useUpdateTag, useDeleteTag } from "@/hooks/use-tags"
import { useConfirm } from "@/components/shared/prompt-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Check, X, Tags } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function TagManager() {
  const { t } = useTranslation("settings")
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
          toast.success(t("tag.updated"))
        },
        onError: (err) => toast.error(t("tag.updateFailed", { error: String(err) })),
      },
    )
  }

  const handleDelete = async (tag: { id: string; name: string }) => {
    const ok = await confirm(
      t("tag.deleteConfirm", { name: tag.name }),
      t("tag.deleteDescription"),
    )
    if (ok) {
      deleteTag.mutate(tag.id, {
        onSuccess: () => toast.success(t("tag.deleted")),
        onError: (err) => toast.error(t("tag.deleteFailed", { error: String(err) })),
      })
    }
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full mb-4">
          <Tags className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">
          {t("tag.noTags")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className={cn(
            "group flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200",
            editingId === tag.id ? "bg-accent/40" : "hover:bg-accent/30",
          )}
        >
          {editingId === tag.id ? (
            <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
              <label
                className="relative h-5 w-5 shrink-0 rounded-full border border-black/10 dark:border-white/10 ring-offset-background transition-transform hover:scale-110 active:scale-95 cursor-pointer focus-within:ring-2 focus-within:ring-ring"
                style={{ backgroundColor: editColor }}
                aria-label={t("tag.color")}
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                />
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit()
                  if (e.key === "Escape") cancelEdit()
                }}
                className="h-7 flex-1 text-sm bg-transparent"
                autoFocus
                placeholder={t("tag.namePlaceholder")}
                aria-label={t("tag.namePlaceholder")}
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-primary hover:bg-primary/10"
                  onClick={saveEdit}
                  aria-label={t("tag.save")}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:bg-muted"
                  onClick={cancelEdit}
                  aria-label={t("tag.cancel")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-200">
              <div
                className="h-4 w-4 shrink-0 rounded-full border border-black/10 dark:border-white/10 shadow-xs"
                style={{ backgroundColor: tag.color }}
              />
              <span className="flex-1 text-sm font-medium truncate">{tag.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => startEdit(tag)}
                  aria-label={t("tag.edit")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(tag)}
                  aria-label={t("tag.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
