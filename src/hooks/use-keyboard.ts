import { useEffect } from "react"
import { useAppStore } from "@/stores/app-store"
import { useRouter } from "@tanstack/react-router"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"

export function useGlobalKeyboard() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey

      // Cmd+\ — Toggle sidebar
      if (meta && e.key === "\\") {
        e.preventDefault()
        toggleSidebar()
      }

      // Cmd+S — Manual backup
      if (meta && e.key === "s") {
        e.preventDefault()
        invoke("create_backup")
          .then(() => toast.success("Backup created"))
          .catch((err) => toast.error(`Backup failed: ${err}`))
      }

      // Cmd+N — New card (context-dependent, handled by current view)
      if (meta && e.key === "n") {
        e.preventDefault()
        // Dispatch a custom event that board views can listen to
        window.dispatchEvent(new CustomEvent("kanban:new-card"))
      }

      // Cmd+, — Settings (also handle period as fallback)
      if (meta && (e.key === "," || e.code === "Comma")) {
        e.preventDefault()
        router.navigate({ to: "/settings" })
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [toggleSidebar, router])
}
