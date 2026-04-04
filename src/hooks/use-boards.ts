import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { boardApi } from "@/lib/tauri"

export function useBoards(projectId: string | undefined) {
  return useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => boardApi.list(projectId!),
    enabled: !!projectId,
  })
}

export function useAllBoards() {
  return useQuery({
    queryKey: ["all-boards"],
    queryFn: () => boardApi.listAll(),
  })
}

export function useBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => boardApi.get(boardId!),
    enabled: !!boardId,
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      boardApi.create(projectId, name),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["boards", vars.projectId] }),
  })
}

export function useUpdateBoard(projectId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; sort_order?: number; background_type?: string | null; background_value?: string | null } }) =>
      boardApi.update(id, updates),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["boards", projectId] })
      qc.invalidateQueries({ queryKey: ["board", vars.id] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useDeleteBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => boardApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useMoveBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, targetProjectId }: { boardId: string; targetProjectId: string }) =>
      boardApi.move(boardId, targetProjectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] })
      qc.invalidateQueries({ queryKey: ["board"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useCloneBoard(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ boardId, newName, includeCards }: { boardId: string; newName: string; includeCards: boolean }) =>
      boardApi.clone(boardId, newName, includeCards),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] })
      queryClient.invalidateQueries({ queryKey: ["project-summaries"] })
      queryClient.invalidateQueries({ queryKey: ["urgent-cards"] })
      queryClient.invalidateQueries({ queryKey: ["unified-cards"] })
      queryClient.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}
