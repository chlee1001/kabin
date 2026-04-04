import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tagApi } from "@/lib/tauri"

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: tagApi.list,
  })
}

export function useCardTags(cardId: string | undefined) {
  return useQuery({
    queryKey: ["card-tags", cardId],
    queryFn: () => tagApi.getForCard(cardId!),
    enabled: !!cardId,
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      tagApi.create(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  })
}

export function useUpdateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, color }: { id: string; name?: string; color?: string }) =>
      tagApi.update(id, name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] })
      qc.invalidateQueries({ queryKey: ["card-tags"] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useAddCardTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: string; tagId: string }) =>
      tagApi.addToCard(cardId, tagId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["card-tags", vars.cardId] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useRemoveCardTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, tagId }: { cardId: string; tagId: string }) =>
      tagApi.removeFromCard(cardId, tagId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["card-tags", vars.cardId] })
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}
