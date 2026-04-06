import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { invoke } from "@tauri-apps/api/core"

export interface UnifiedCardTag {
  id: string
  name: string
  color: string
}

export interface UnifiedCard {
  card_id: string
  title: string
  due_date: string | null
  start_date: string | null
  color: string | null
  sort_order: number
  completed: boolean
  column_id: string
  column_name: string
  status_category: string
  board_id: string
  board_name: string
  project_id: string
  project_name: string
  project_color: string
  subtask_total: number
  subtask_done: number
  tags: UnifiedCardTag[]
}

export interface CardFilter {
  project_ids?: string[]
  board_ids?: string[]
  status_categories?: string[]
  tag_ids?: string[]
  due_date_from?: string
  due_date_to?: string
  search?: string
}

export function useUnifiedCards() {
  return useQuery({
    queryKey: ["unified-cards"],
    queryFn: () => invoke<UnifiedCard[]>("get_cards_by_status_category"),
  })
}

export function useFilteredCards(filters: CardFilter) {
  return useQuery({
    queryKey: ["filtered-cards", filters],
    queryFn: () => invoke<UnifiedCard[]>("get_all_cards_with_filters", { filters }),
  })
}

export function useMoveCardByStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, targetStatus }: { cardId: string; targetStatus: string }) =>
      invoke<string>("move_card_by_status_category", { cardId, targetStatus }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
      qc.invalidateQueries({ queryKey: ["cards"] })
    },
  })
}

export function useReorderUnifiedCards() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardIds: string[]) =>
      invoke<void>("reorder_unified_cards", { cardIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
      qc.invalidateQueries({ queryKey: ["cards"] })
    },
  })
}
