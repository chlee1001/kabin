import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { subtaskApi } from "@/lib/tauri"

export function useSubtasks(cardId: string | undefined) {
  return useQuery({
    queryKey: ["subtasks", cardId],
    queryFn: () => subtaskApi.list(cardId!),
    enabled: !!cardId,
  })
}

export function useCreateSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, title }: { cardId: string; title: string }) =>
      subtaskApi.create(cardId, title),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["subtasks", vars.cardId] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useUpdateSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title, completed }: { id: string; title?: string; completed?: boolean }) =>
      subtaskApi.update(id, title, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks"] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useDeleteSubtask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subtaskApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subtasks"] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useReorderSubtasks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, subtaskIds }: { cardId: string; subtaskIds: string[] }) =>
      subtaskApi.reorder(cardId, subtaskIds),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["subtasks", vars.cardId] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}
