import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { attachmentApi } from "@/lib/tauri"

export function useCardAttachments(cardId: string | undefined) {
  return useQuery({
    queryKey: ["card-attachments", cardId],
    queryFn: () => attachmentApi.list(cardId!),
    enabled: !!cardId,
  })
}

export function useAddCardAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ cardId, sourcePath }: { cardId: string; sourcePath: string }) =>
      attachmentApi.add(cardId, sourcePath),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["card-attachments", vars.cardId] }),
  })
}

export function useDeleteCardAttachment() {
  const qc = useQueryClient()
  return useMutation({
    // cardId is carried only to scope the cache invalidation.
    mutationFn: ({ id }: { id: string; cardId: string }) => attachmentApi.delete(id),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["card-attachments", vars.cardId] }),
  })
}
