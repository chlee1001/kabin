import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  className?: string
  inputClassName?: string
  trigger?: "click" | "doubleClick"
}

export function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  trigger = "doubleClick",
}: InlineEditProps) {
  const { t } = useTranslation("common")
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      setDraft(value)
    }
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit()
          if (e.key === "Escape") {
            setDraft(value)
            setEditing(false)
          }
        }}
        className={cn("h-auto py-0 px-1 text-inherit font-inherit border-primary/40 w-auto min-w-[60px] max-w-[200px]", inputClassName)}
        style={{ width: `${Math.min(Math.max(draft.length * 8 + 16, 60), 200)}px` }}
      />
    )
  }

  const triggerProps =
    trigger === "click"
      ? { onClick: (e: React.MouseEvent) => { e.stopPropagation(); setEditing(true) } }
      : { onDoubleClick: (e: React.MouseEvent) => { e.stopPropagation(); setEditing(true) } }

  return (
    <span
      {...triggerProps}
      className={cn("cursor-text rounded px-1 -mx-1 hover:bg-muted/50 transition-colors", className)}
      title={trigger === "doubleClick" ? t("edit.doubleClickToEdit") : t("edit.clickToEdit")}
    >
      {value}
    </span>
  )
}
