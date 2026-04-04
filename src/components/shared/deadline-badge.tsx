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

  let label: string
  let variant: "destructive" | "default" | "secondary" | "outline"

  if (diff < 0) {
    label = "Overdue"
    variant = "destructive"
  } else if (diff === 0) {
    label = "Today"
    variant = "destructive"
  } else if (diff === 1) {
    label = "Tomorrow"
    variant = "default"
  } else {
    label = `${diff}d`
    variant = "secondary"
  }

  return (
    <Badge variant={variant} className="shrink-0 text-xs">
      {label}
    </Badge>
  )
}
