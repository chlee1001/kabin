import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invoke } from "@tauri-apps/api/core"

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
