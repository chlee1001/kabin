import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DatePickerProps {
  value: string | null
  onChange: (date: string | null) => void
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 text-sm"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onChange(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
