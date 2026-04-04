import { useQuery } from "@tanstack/react-query"
import { invoke } from "@tauri-apps/api/core"

export interface ProjectSummary {
  id: string
  name: string
  color: string
  total_cards: number
  todo_count: number
  in_progress_count: number
  done_count: number
  other_count: number
  urgent_count: number
}

export interface UrgentCard {
  card_id: string
  title: string
  due_date: string
  project_id: string
  project_name: string
  project_color: string
  board_id: string
  board_name: string
  status_category: string
  column_name: string
}

export function useProjectSummaries() {
  return useQuery({
    queryKey: ["project-summaries"],
    queryFn: () => invoke<ProjectSummary[]>("get_project_summaries"),
  })
}

export function useUrgentCards() {
  return useQuery({
    queryKey: ["urgent-cards"],
    queryFn: () => invoke<UrgentCard[]>("get_urgent_cards"),
  })
}
