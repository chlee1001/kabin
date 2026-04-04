import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectSummary } from "@/hooks/use-dashboard"

interface ProjectSummaryCardProps {
  summary: ProjectSummary
}

export function ProjectSummaryCard({ summary }: ProjectSummaryCardProps) {
  const { total_cards, todo_count, in_progress_count, done_count, other_count } = summary
  const total = total_cards || 1

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
          {total_cards} card{total_cards !== 1 ? "s" : ""}
        </p>

        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          {todo_count > 0 && (
            <div className="bg-[#64748b]" style={{ width: `${(todo_count / total) * 100}%` }} />
          )}
          {in_progress_count > 0 && (
            <div className="bg-[#3b82f6]" style={{ width: `${(in_progress_count / total) * 100}%` }} />
          )}
          {done_count > 0 && (
            <div className="bg-[#22c55e]" style={{ width: `${(done_count / total) * 100}%` }} />
          )}
          {other_count > 0 && (
            <div className="bg-[#a855f7]" style={{ width: `${(other_count / total) * 100}%` }} />
          )}
        </div>

        {summary.urgent_count > 0 && (
          <p className="text-xs font-medium text-destructive">
            {summary.urgent_count} urgent deadline{summary.urgent_count !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
