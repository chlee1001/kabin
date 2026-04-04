import type { StatusCategory } from "./tauri"

export const STATUS_CATEGORIES: { value: StatusCategory; label: string; color: string }[] = [
  { value: "todo", label: "To Do", color: "#64748b" },
  { value: "in_progress", label: "In Progress", color: "#3b82f6" },
  { value: "done", label: "Done", color: "#22c55e" },
  { value: "other", label: "Other", color: "#a855f7" },
]

export const STATUS_CATEGORY_MAP = Object.fromEntries(
  STATUS_CATEGORIES.map((s) => [s.value, s]),
) as Record<StatusCategory, (typeof STATUS_CATEGORIES)[number]>

export const DEADLINE_COLORS = {
  overdue: "#ef4444",
  today: "#f97316",
  tomorrow: "#eab308",
  thisWeek: "#64748b",
} as const

export const DEFAULT_ACCENT_COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#71717a", // Zinc (Neutral)
]

export const BOARD_BACKGROUND_PRESETS = [
  { id: "nebula", label: "Nebula", value: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" },
  { id: "midnight", label: "Midnight", value: "linear-gradient(135deg, #020617 0%, #0f172a 100%)" },
  { id: "deep-sea", label: "Deep Sea", value: "linear-gradient(135deg, #0c4a6e 0%, #082f49 100%)" },
  { id: "emerald-dusk", label: "Emerald Dusk", value: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)" },
  { id: "sunset-glow", label: "Sunset Glow", value: "linear-gradient(135deg, #7c2d12 0%, #431407 100%)" },
  { id: "slate-storm", label: "Slate Storm", value: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" },
  { id: "lavender-mist", label: "Lavender Mist", value: "linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)" },
  { id: "rose-shadow", label: "Rose Shadow", value: "linear-gradient(135deg, #831843 0%, #500724 100%)" },
] as const
