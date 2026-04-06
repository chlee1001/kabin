import { differenceInDays, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

interface DeadlineBadgeProps {
  dueDate: string
}

export function DeadlineBadge({ dueDate }: DeadlineBadgeProps) {
  const { t } = useTranslation("common")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = parseISO(dueDate)
  const diff = differenceInDays(due, today)

  let label: string
  let variant: "destructive" | "default" | "secondary" | "outline"

  if (diff < 0) {
    label = t("deadline.overdue")
    variant = "destructive"
  } else if (diff === 0) {
    label = t("deadline.today")
    variant = "destructive"
  } else if (diff === 1) {
    label = t("deadline.tomorrow")
    variant = "default"
  } else {
    label = t("deadline.days", { count: diff })
    variant = "secondary"
  }

  return (
    <Badge variant={variant} className="shrink-0 text-xs">
      {label}
    </Badge>
  )
}
