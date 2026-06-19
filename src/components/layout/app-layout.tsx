import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useAppStore } from "@/stores/app-store"
import { useGlobalKeyboard } from "@/hooks/use-keyboard"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  useGlobalKeyboard()
  const { sidebarOpen } = useAppStore()

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
