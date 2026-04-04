import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react"
import { settingsApi } from "@/lib/tauri"
import { hexToOklch, oklchToCss, getContrastForeground } from "@/lib/color-utils"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: string | null
  setAccentColor: (color: string | null) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

function applyAccentColor(hex: string | null, isDark: boolean) {
  const root = document.documentElement.style
  if (!hex) {
    root.removeProperty("--primary")
    root.removeProperty("--primary-foreground")
    root.removeProperty("--primary-subtle")
    root.removeProperty("--ring")
    root.removeProperty("--sidebar-primary")
    root.removeProperty("--sidebar-ring")
    return
  }
  let { l, c, h } = hexToOklch(hex)
  
  // In dark mode, we might want to boost lightness slightly if it's too dark
  if (isDark && l < 0.4) {
    l = 0.45
  } else if (!isDark && l > 0.85) {
    // In light mode, if it's too light, darken it for better visibility
    l = 0.8
  }

  const primary = oklchToCss(l, c, h)
  const foreground = getContrastForeground(l)
  const subtle = oklchToCss(isDark ? 0.22 : 0.95, c * 0.25, h)

  root.setProperty("--primary", primary)
  root.setProperty("--primary-foreground", foreground)
  root.setProperty("--primary-subtle", subtle)
  root.setProperty("--ring", primary)
  root.setProperty("--sidebar-primary", primary)
  root.setProperty("--sidebar-ring", primary)
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "kanban-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  )
  const [accentColor, setAccentColorState] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    const updateTheme = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light"
      const effective = theme === "system" ? systemTheme : theme
      const isDark = effective === "dark"
      
      root.classList.toggle("dark", isDark)
      applyAccentColor(accentColor, isDark)
    }

    updateTheme()
    mediaQuery.addEventListener("change", updateTheme)
    return () => mediaQuery.removeEventListener("change", updateTheme)
  }, [theme, accentColor])

  useLayoutEffect(() => {
    settingsApi.get("accent_color").then((color) => {
      if (color) {
        setAccentColorState(color)
      }
    })
  }, [])

  const setTheme = (next: Theme) => {
    localStorage.setItem(storageKey, next)
    setThemeState(next)
  }

  const setAccentColor = (color: string | null) => {
    setAccentColorState(color)
    if (color) {
      settingsApi.set("accent_color", color)
    } else {
      settingsApi.delete("accent_color")
    }
  }

  return (
    <ThemeContext value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
