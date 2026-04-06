import { useTranslation } from "react-i18next"
import { useRef } from "react"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

const COLORS = [
  null,
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899",
]

interface ColorPickerProps {
  value: string | null
  onChange: (color: string | null) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const { t } = useTranslation("card")
  const colorInputRef = useRef<HTMLInputElement>(null)
  const isCustomColor = value !== null && !COLORS.includes(value)

  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORS.map((color) => (
        <button
          key={color ?? "none"}
          onClick={() => onChange(color)}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
            value === color ? "border-foreground" : "border-transparent",
            !color && "bg-muted",
          )}
          style={color ? { backgroundColor: color } : undefined}
          title={color ?? t("noColor")}
        />
      ))}
      <div className="relative">
        <button
          onClick={() => colorInputRef.current?.click()}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
            isCustomColor ? "border-foreground" : "border-dashed border-muted-foreground bg-muted",
          )}
          style={isCustomColor ? { backgroundColor: value } : undefined}
          title={t("customColor")}
        >
          {!isCustomColor && <Plus className="h-3 w-3 text-muted-foreground" />}
        </button>
        <input
          ref={colorInputRef}
          type="color"
          className="sr-only"
          value={isCustomColor ? value : "#6366f1"}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
