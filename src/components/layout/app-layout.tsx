import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useAppStore } from "@/stores/app-store"
import { useGlobalKeyboard } from "@/hooks/use-keyboard"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  useGlobalKeyboard()
  const { sidebarOpen, sidebarCollapsed } = useAppStore()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {sidebarOpen && <Sidebar />}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main
          className={cn(
            "flex-1 overflow-auto",
            sidebarOpen && !sidebarCollapsed && "ml-0",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
