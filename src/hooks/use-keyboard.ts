import { useEffect } from "react"
import i18next from "i18next"
import { useAppStore } from "@/stores/app-store"
import { useRouter } from "@tanstack/react-router"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"

function isTyping(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if ((el as HTMLElement).isContentEditable) return true
  const role = el.getAttribute("role")
  if (role === "textbox" || role === "combobox" || role === "searchbox") return true
  return false
}

function hasOpenDialog(): boolean {
  return document.querySelector("[role='dialog'], dialog[open]") !== null
}

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
        return
      }

      // Cmd+S — Manual backup
      if (meta && e.key === "s") {
        e.preventDefault()
        invoke("create_backup")
          .then(() => toast.success(i18next.t("toast.backupSuccess", { ns: "common" })))
          .catch((err) => toast.error(i18next.t("toast.backupFailed", { ns: "common", error: String(err) })))
        return
      }

      // Cmd+N — New card (only on board views where a listener exists)
      if (meta && e.key === "n") {
        e.preventDefault()
        if (router.state.location.pathname.startsWith("/boards/")) {
          window.dispatchEvent(new CustomEvent("kanban:new-card"))
        }
        return
      }

      // Cmd+, — Settings
      if (meta && (e.key === "," || e.code === "Comma")) {
        e.preventDefault()
        router.navigate({ to: "/settings" })
        return
      }

      // Cmd+1/2/3 — View navigation
      if (meta && e.key === "1") {
        e.preventDefault()
        router.navigate({ to: "/dashboard" })
        return
      }
      if (meta && e.key === "2") {
        e.preventDefault()
        router.navigate({ to: "/unified" })
        return
      }
      if (meta && e.key === "3") {
        e.preventDefault()
        router.navigate({ to: "/table" })
        return
      }

      // Single-letter shortcuts — only when not typing and no dialog open
      if (!meta && !e.altKey && !isTyping() && !hasOpenDialog()) {
        // ? — Keyboard shortcuts help
        if (e.key === "?") {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent("kanban:shortcuts-help"))
          return
        }

        // F — Focus filter bar
        if (e.key === "f" || e.key === "F") {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent("kanban:focus-filter"))
          return
        }

        // N or C — New card (board context only)
        if (e.key === "n" || e.key === "c") {
          if (router.state.location.pathname.startsWith("/boards/")) {
            e.preventDefault()
            window.dispatchEvent(new CustomEvent("kanban:new-card"))
          }
          return
        }
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [toggleSidebar, router])
}
