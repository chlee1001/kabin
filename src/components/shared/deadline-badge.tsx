import { differenceInDays, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DeadlineBadgeProps {
  dueDate: string
  /** Completed cards show the deadline neutrally — no overdue (red) emphasis. */
  completed?: boolean
}

export function DeadlineBadge({ dueDate, completed = false }: DeadlineBadgeProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseISO(dueDate)
  const diff = differenceInDays(due, today)

  // D-day notation: future → D-3, due today → D-DAY, overdue → D+2.
  const label = diff === 0 ? "D-DAY" : diff > 0 ? `D-${diff}` : `D+${-diff}`

  let variant: "destructive" | "default" | "secondary" | "outline"
  if (completed) {
    variant = "outline"
  } else if (diff <= 0) {
    variant = "destructive"
  } else if (diff === 1) {
    variant = "default"
  } else {
    variant = "secondary"
  }

  return (
    <Badge
      variant={variant}
      className={cn("shrink-0 text-xs tabular-nums", completed && "text-muted-foreground/60")}
    >
      {label}
    </Badge>
  )
}
