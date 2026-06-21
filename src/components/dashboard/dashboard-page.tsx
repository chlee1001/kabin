import { useTranslation } from "react-i18next"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useProjectSummaries, useUrgentCards } from "@/hooks/use-dashboard"
import { useUpdateCard } from "@/hooks/use-cards"
import { useCreateProject } from "@/hooks/use-projects"
import { settingsApi } from "@/lib/tauri"
import { usePrompt } from "@/components/shared/prompt-dialog"
import { ProjectSummaryCard } from "./project-summary-card"
import { UrgentList } from "./urgent-list"
import { CardDetailModal } from "@/components/card-detail/card-detail-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function DashboardPage() {
  const { t } = useTranslation(["dashboard", "common"])
  const { data: summaries, isLoading: loadingSummaries } = useProjectSummaries()
  const { data: urgentCards, isLoading: loadingUrgent } = useUrgentCards()
  const createProject = useCreateProject()
  const updateCard = useUpdateCard()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const prompt = usePrompt()
  const { data: urgentDays } = useQuery({
    queryKey: ["setting", "urgent_days"],
    queryFn: () => settingsApi.get("urgent_days"),
  })

  const handleComplete = (cardId: string) =>
    updateCard.mutate({ id: cardId, updates: { completed: true } })

  const handleNewProject = async () => {
    const name = await prompt(t("projectName"))
    if (name) createProject.mutate({ name })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button onClick={handleNewProject} className="cursor-pointer gap-2">
          <Plus className="h-4 w-4" />
          {t("newProject")}
        </Button>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">{t("projectsOverview")}</h2>
        {loadingSummaries ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border p-6">
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : summaries?.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
            <p>{t("noProjectsYet")}</p>
            <Button variant="outline" className="mt-4 cursor-pointer gap-2" onClick={handleNewProject}>
              <Plus className="h-4 w-4" />
              {t("createFirstProject")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaries?.map((summary) => (
              <Link key={summary.id} to="/projects/$projectId" params={{ projectId: summary.id }}>
                <ProjectSummaryCard summary={summary} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline gap-2">
          <h2 className="text-lg font-medium">{t("urgentFocus")}</h2>
          <span className="text-sm text-muted-foreground">
            {t("urgentFocusDesc", { days: urgentDays ?? "5" })}
          </span>
        </div>
        {loadingUrgent ? (
          <div className="space-y-2 rounded-lg border border-border p-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2">
                <div className="h-5 w-5 animate-pulse rounded-md bg-muted" />
                <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-5 w-10 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <UrgentList
            cards={urgentCards ?? []}
            onCardClick={setSelectedCardId}
            onComplete={handleComplete}
          />
        )}
      </section>

      <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
    </div>
  )
}
