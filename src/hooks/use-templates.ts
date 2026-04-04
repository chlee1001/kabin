import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { templateApi } from "@/lib/tauri"

export function useTemplates(boardId: string | undefined) {
  return useQuery({
    queryKey: ["templates", boardId],
    queryFn: () => templateApi.list(boardId!),
    enabled: !!boardId,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) =>
      templateApi.create(boardId, name),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["templates", vars.boardId] }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; title?: string; description?: string; color?: string | null } }) =>
      templateApi.update(id, updates),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["templates"] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => templateApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["templates"] }),
  })
}

export function useCreateCardFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, columnId }: { templateId: string; columnId: string }) =>
      templateApi.createCard(templateId, columnId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}
