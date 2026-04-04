import { useProjects } from "@/hooks/use-projects"
import { useAllBoards } from "@/hooks/use-boards"
import { useColumns } from "@/hooks/use-columns"
import { useMoveCard } from "@/hooks/use-cards"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Search, Check } from "lucide-react"
import { toast } from "sonner"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MoveCardPickerProps {
  cardId: string
  currentColumnId: string
}

export function MoveCardPicker({ cardId, currentColumnId }: MoveCardPickerProps) {
  const { data: projects } = useProjects()
  const { data: allBoards } = useAllBoards()
  const [selectedBoardId, setSelectedBoardId] = useState<string>("")
  const [selectedColumnId, setSelectedColumnId] = useState<string>("")
  const [open, setOpen] = useState(false)
  
  const { data: columns } = useColumns(selectedBoardId || undefined)
  const moveCard = useMoveCard()

  const groupedBoards = useMemo(() => {
    if (!projects || !allBoards) return []
    return projects.map(project => ({
      ...project,
      boards: allBoards.filter(board => board.project_id === project.id)
    })).filter(p => p.boards.length > 0)
  }, [projects, allBoards])

  const selectedBoard = useMemo(() => 
    allBoards?.find(b => b.id === selectedBoardId),
    [allBoards, selectedBoardId]
  )

  const selectedProject = useMemo(() => 
    projects?.find(p => p.id === selectedBoard?.project_id),
    [projects, selectedBoard]
  )

  const handleMove = () => {
    if (!selectedColumnId || selectedColumnId === currentColumnId) return
    moveCard.mutate(
      { cardId, targetColumnId: selectedColumnId, position: 0 },
      {
        onSuccess: () => {
          toast.success("Card moved")
          setSelectedBoardId("")
          setSelectedColumnId("")
        },
        onError: (err) => toast.error(`Move failed: ${err}`),
      },
    )
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-9 px-3 text-xs font-medium bg-background"
          >
            {selectedBoard ? (
              <span className="truncate">
                <span className="text-muted-foreground">{selectedProject?.name} / </span>
                {selectedBoard.name}
              </span>
            ) : (
              <span className="text-muted-foreground">Select destination board...</span>
            )}
            <Search className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command className="max-h-[300px]">
            <CommandInput placeholder="Search boards..." className="h-9" />
            <CommandList>
              <CommandEmpty>No board found.</CommandEmpty>
              {groupedBoards.map((project) => (
                <CommandGroup key={project.id} heading={project.name}>
                  {project.boards.map((board) => (
                    <CommandItem
                      key={board.id}
                      value={`${project.name} ${board.name}`}
                      onSelect={() => {
                        setSelectedBoardId(board.id)
                        setSelectedColumnId("")
                        setOpen(false)
                      }}
                      className="text-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3 w-3",
                          selectedBoardId === board.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {board.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedBoardId && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 gap-1.5">
            {columns?.map((column) => (
              <Button
                key={column.id}
                variant={selectedColumnId === column.id ? "default" : "secondary"}
                size="sm"
                className={cn(
                  "h-8 text-[10px] font-semibold transition-all",
                  selectedColumnId === column.id && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
                onClick={() => setSelectedColumnId(column.id)}
              >
                {column.name}
              </Button>
            ))}
          </div>
          
          {selectedColumnId && selectedColumnId !== currentColumnId && (
            <Button 
              size="sm" 
              className="w-full gap-2 h-8 text-[11px] font-bold shadow-md bg-primary hover:bg-primary/90 mt-1" 
              onClick={handleMove}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Confirm Move
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
