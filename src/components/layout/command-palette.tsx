import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { invoke } from "@tauri-apps/api/core"

interface SearchResult {
  card_id: string
  title: string
  snippet: string
  project_name: string
  project_color: string
  board_name: string
  column_name: string
}

interface CommandPaletteProps {
  onSelectCard: (cardId: string) => void
}

export function CommandPalette({ onSelectCard }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    try {
      const res = await invoke<SearchResult[]>("global_search", {
        query: value,
        limit: 20,
      })
      setResults(res)
    } catch (err) {
      console.error("Search error:", err)
      setResults([])
    }
  }, [])

  const handleSelect = (cardId: string) => {
    setOpen(false)
    setQuery("")
    setResults([])
    onSelectCard(cardId)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-lg">
        <DialogTitle className="sr-only">Search Cards</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12">
          <CommandInput
            placeholder="Search cards..."
            value={query}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim().length < 2 ? "Type to search..." : "No results found."}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Cards">
                {results.map((r) => (
                  <CommandItem
                    key={r.card_id}
                    value={r.card_id}
                    onSelect={() => handleSelect(r.card_id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: r.project_color }}
                      />
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.project_name} / {r.board_name} / {r.column_name}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
