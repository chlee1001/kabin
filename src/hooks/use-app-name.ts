import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "@/lib/tauri"

const QUERY_KEY = ["settings", "app_name"]

export function useAppName() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => settingsApi.get("app_name"),
  })
}

export function useSetAppName() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) =>
      name.trim()
        ? settingsApi.set("app_name", name.trim())
        : settingsApi.delete("app_name"),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}
