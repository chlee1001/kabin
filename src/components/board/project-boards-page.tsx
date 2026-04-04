import { useParams, Link } from "@tanstack/react-router"
import { useBoards, useCreateBoard } from "@/hooks/use-boards"
import { useProjects } from "@/hooks/use-projects"
import { usePrompt } from "@/components/shared/prompt-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FolderOpen } from "lucide-react"

export function ProjectBoardsPage() {
  const { projectId } = useParams({ from: "/projects/$projectId" })
  const { data: boards, isLoading } = useBoards(projectId)
  const { data: projects } = useProjects()
  const project = projects?.find((p) => p.id === projectId)
  const createBoard = useCreateBoard()

  const prompt = usePrompt()
  const handleCreate = async () => {
    const name = await prompt("Board name")
    if (name) createBoard.mutate({ projectId, name })
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {project && (
            <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          )}
          <h1 className="text-2xl font-semibold">{project?.name ?? "Boards"}</h1>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      {boards?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderOpen className="mb-4 h-12 w-12" />
          <p>No boards yet</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards?.map((board) => (
            <Link key={board.id} to="/boards/$boardId" params={{ boardId: board.id }}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{board.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
