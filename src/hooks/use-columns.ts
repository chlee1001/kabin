import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { columnApi, type StatusCategory } from "@/lib/tauri"

export function useColumns(boardId: string | undefined) {
  return useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => columnApi.list(boardId!),
    enabled: !!boardId,
  })
}

export function useCreateColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, name, statusCategory }: { boardId: string; name: string; statusCategory?: StatusCategory }) =>
      columnApi.create(boardId, name, statusCategory),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["columns", vars.boardId] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useUpdateColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; status_category?: StatusCategory; sort_order?: number } }) =>
      columnApi.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["columns"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useDeleteColumn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => columnApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["columns"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useReorderColumns() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, columnIds }: { boardId: string; columnIds: string[] }) =>
      columnApi.reorder(boardId, columnIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["columns"] }),
  })
}
