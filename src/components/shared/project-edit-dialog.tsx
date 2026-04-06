import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DEFAULT_ACCENT_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ProjectEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  initialName?: string
  initialColor?: string
  onSave: (name: string, color: string) => void
  saving?: boolean
}

export function ProjectEditDialog({
  open,
  onOpenChange,
  title,
  initialName = "",
  initialColor = "#6366f1",
  onSave,
  saving,
}: ProjectEditDialogProps) {
  const { t } = useTranslation(["common", "dashboard", "card"])
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setColor(initialColor)
    }
  }, [open, initialName, initialColor])

  const handleSave = () => {
    if (!name.trim()) return
    onSave(name.trim(), color)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("name")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={t("dashboard:projectName") + "..."}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t("color")}</label>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_ACCENT_COLORS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => setColor(hex)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === hex ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("button.cancel")}</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? t("card:saving") : t("button.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
