import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useProjectSummaries, useUrgentCards } from "@/hooks/use-dashboard"
import { useCreateProject } from "@/hooks/use-projects"
import { usePrompt } from "@/components/shared/prompt-dialog"
import { ProjectSummaryCard } from "./project-summary-card"
import { UrgentList } from "./urgent-list"
import { CardDetailModal } from "@/components/card-detail/card-detail-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function DashboardPage() {
  const { data: summaries, isLoading: loadingSummaries } = useProjectSummaries()
  const { data: urgentCards, isLoading: loadingUrgent } = useUrgentCards()
  const createProject = useCreateProject()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const prompt = usePrompt()

  const handleNewProject = async () => {
    const name = await prompt("Project name")
    if (name) createProject.mutate({ name })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button onClick={handleNewProject} className="cursor-pointer gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">Projects Overview</h2>
        {loadingSummaries ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : summaries?.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
            <p>No projects yet</p>
            <Button variant="outline" className="mt-4 cursor-pointer gap-2" onClick={handleNewProject}>
              <Plus className="h-4 w-4" />
              Create your first project
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
        <h2 className="mb-4 text-lg font-medium">Urgent Focus</h2>
        {loadingUrgent ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <UrgentList cards={urgentCards ?? []} onCardClick={setSelectedCardId} />
        )}
      </section>

      <CardDetailModal cardId={selectedCardId} onClose={() => setSelectedCardId(null)} />
    </div>
  )
}
