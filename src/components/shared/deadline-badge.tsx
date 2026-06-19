import { differenceInDays, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface DeadlineBadgeProps {
  dueDate: string
}

export function DeadlineBadge({ dueDate }: DeadlineBadgeProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseISO(dueDate)
  const diff = differenceInDays(due, today)

  // D-day notation: future → D-3, due today → D-DAY, overdue → D+2.
  const label = diff === 0 ? "D-DAY" : diff > 0 ? `D-${diff}` : `D+${-diff}`

  let variant: "destructive" | "default" | "secondary" | "outline"
  if (diff <= 0) {
    variant = "destructive"
  } else if (diff === 1) {
    variant = "default"
  } else {
    variant = "secondary"
  }

  return (
    <Badge variant={variant} className="shrink-0 text-xs tabular-nums">
      {label}
    </Badge>
  )
}
