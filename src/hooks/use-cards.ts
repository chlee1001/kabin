import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cardApi, type Card, type CardUpdate } from "@/lib/tauri"

export function useCards(columnId: string | undefined) {
  return useQuery({
    queryKey: ["cards", columnId],
    queryFn: () => cardApi.list(columnId!),
    enabled: !!columnId,
  })
}

export function useCardsEnriched(columnId: string | undefined) {
  return useQuery({
    queryKey: ["cards", columnId],
    queryFn: () => cardApi.listEnriched(columnId!),
    enabled: !!columnId,
  })
}

export function useCard(id: string | undefined) {
  return useQuery({
    queryKey: ["card", id],
    queryFn: () => cardApi.get(id!),
    enabled: !!id,
  })
}

export function useCardLocation(id: string | undefined) {
  return useQuery({
    queryKey: ["card-location", id],
    queryFn: () => cardApi.getLocation(id!),
    enabled: !!id,
  })
}

export function useCreateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, title, description }: { columnId: string; title: string; description?: string }) =>
      cardApi.create(columnId, title, description),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["cards", vars.columnId] }),
  })
}

export function useUpdateCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CardUpdate }) =>
      cardApi.update(id, updates),
    onSuccess: (data) => {
      qc.setQueryData(["card", data.id], data)
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["card-location"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useDeleteCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cardApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["card-location"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useCloneCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (cardId: string) => cardApi.clone(cardId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useMoveCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, targetColumnId, position }: { cardId: string; targetColumnId: string; position: number }) =>
      cardApi.move(cardId, targetColumnId, position),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["card-location"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useReorderCards() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ columnId, cardIds }: { columnId: string; cardIds: string[] }) =>
      cardApi.reorder(columnId, cardIds),
    onMutate: async ({ columnId, cardIds }) => {
      await qc.cancelQueries({ queryKey: ["cards", columnId] })
      const prev = qc.getQueryData<Card[]>(["cards", columnId])
      if (prev) {
        const reordered = cardIds
          .map((id) => prev.find((c) => c.id === id))
          .filter((c): c is Card => !!c)
        qc.setQueryData(["cards", columnId], reordered)
      }
      return { prev, columnId }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cards", ctx.columnId], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["cards"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}
