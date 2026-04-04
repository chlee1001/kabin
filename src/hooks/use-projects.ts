import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projectApi, type Project } from "@/lib/tauri"

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectApi.list,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      projectApi.create(name, color),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { name?: string; color?: string; sort_order?: number } }) =>
      projectApi.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["projects"] })
      const prev = qc.getQueryData<Project[]>(["projects"])
      qc.setQueryData<Project[]>(["projects"], (old) =>
        old?.filter((p) => p.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["projects"] })
      qc.invalidateQueries({ queryKey: ["project-summaries"] })
      qc.invalidateQueries({ queryKey: ["urgent-cards"] })
      qc.invalidateQueries({ queryKey: ["unified-cards"] })
      qc.invalidateQueries({ queryKey: ["filtered-cards"] })
    },
  })
}
