import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectSummary } from "@/hooks/use-dashboard"
import { STATUS_CATEGORY_MAP } from "@/lib/constants"

interface ProjectSummaryCardProps {
  summary: ProjectSummary
}

export function ProjectSummaryCard({ summary }: ProjectSummaryCardProps) {
  const { t } = useTranslation(["dashboard", "common"])
  const { total_cards, todo_count, in_progress_count, done_count, other_count } = summary
  const total = total_cards || 1

  // Segments in render order; colors come from STATUS_CATEGORY_MAP.
  const segments = [
    { key: "todo", count: todo_count },
    { key: "in_progress", count: in_progress_count },
    { key: "done", count: done_count },
    { key: "other", count: other_count },
  ] as const

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: summary.color }} />
          <CardTitle className="text-base">{summary.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("cardCount", { count: total_cards })}
        </p>

        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          {segments.map(({ key, count }) =>
            count > 0 ? (
              <div
                key={key}
                style={{
                  backgroundColor: STATUS_CATEGORY_MAP[key].color,
                  width: `${(count / total) * 100}%`,
                }}
              />
            ) : null,
          )}
        </div>

        {/* Legend so each bar color is identifiable, including 'other'. */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {segments.map(({ key, count }) =>
            count > 0 ? (
              <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_CATEGORY_MAP[key].color }}
                />
                {t(STATUS_CATEGORY_MAP[key].label, { ns: "common" })} {count}
              </span>
            ) : null,
          )}
        </div>

        {summary.urgent_count > 0 && (
          <p className="text-xs font-medium text-destructive">
            {t("urgentCount", { count: summary.urgent_count })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
