import { create } from "zustand"

interface AppState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  selectedProjectId: string | null
  selectedBoardId: string | null
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedProject: (id: string | null) => void
  setSelectedBoard: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  selectedProjectId: null,
  selectedBoardId: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedProject: (id) => set({ selectedProjectId: id }),
  setSelectedBoard: (id) => set({ selectedBoardId: id }),
}))
