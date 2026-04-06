import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invoke } from "@tauri-apps/api/core"
import { save, open } from "@tauri-apps/plugin-dialog"

interface BackupInfo {
  file_path: string
  created_at: string
}

export function useLastBackupTime() {
  return useQuery({
    queryKey: ["last-backup-time"],
    queryFn: () => invoke<string | null>("get_last_backup_time"),
    refetchInterval: 60_000,
  })
}

export function useCreateBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => invoke<BackupInfo>("create_backup"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["last-backup-time"] }),
  })
}

export function useExportBackup() {
  return useMutation({
    mutationFn: async () => {
      const path = await save({
        defaultPath: `kabin_backup_${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
      })
      if (!path) throw new Error("cancelled")
      await invoke("export_backup", { path })
    },
  })
}

export function useImportBackup() {
  return useMutation({
    mutationFn: async () => {
      const path = await open({
        multiple: false,
        filters: [{ name: "SQLite Database", extensions: ["db"] }],
      })
      if (!path) throw new Error("cancelled")
      await invoke("import_backup", { path })
    },
  })
}
