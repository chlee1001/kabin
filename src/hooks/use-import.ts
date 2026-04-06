import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"

export type ImportSource = "Kanri" | "Trello"

export interface ImportPreview {
  source: ImportSource
  project_name: string
  board_count: number
  column_count: number
  card_count: number
  tag_count: number
  subtask_count: number
}

export function useSelectImportFile() {
  return useMutation({
    mutationFn: async () => {
      const path = await open({
        multiple: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      })
      if (!path) throw new Error("cancelled")
      return path as string
    },
  })
}

export function usePreviewImport() {
  return useMutation({
    mutationFn: async ({ path, source }: { path: string; source: ImportSource }) => {
      return invoke<ImportPreview>("preview_import", { path, source })
    },
  })
}

export function useExecuteImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ path, source }: { path: string; source: ImportSource }) => {
      return invoke<string>("execute_import", { path, source })
    },
    onSuccess: () => {
      qc.invalidateQueries()
    },
  })
}
