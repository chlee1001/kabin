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

interface TintedVar {
  prop: string
  lightL: number
  darkL: number
  lightC: number
  darkC: number
  /** Dark-mode opacity as CSS percentage (0–100), e.g. 10 → "/ 10%" */
  darkAlpha?: number
}

// Neutral CSS vars tinted with accent hue at low chroma.
// Lightness values match globals.css defaults exactly.
// Chroma: large surfaces (bg/card/popover/sidebar) lowest, small surfaces highest.
const TINTED_NEUTRALS: TintedVar[] = [
  { prop: "--background",                 lightL: 1.000, darkL: 0.140, lightC: 0.006, darkC: 0.010 },
  { prop: "--foreground",                 lightL: 0.145, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--card",                       lightL: 1.000, darkL: 0.180, lightC: 0.006, darkC: 0.015 },
  { prop: "--card-foreground",            lightL: 0.145, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--popover",                    lightL: 1.000, darkL: 0.180, lightC: 0.006, darkC: 0.015 },
  { prop: "--popover-foreground",         lightL: 0.145, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--secondary",                  lightL: 0.970, darkL: 0.250, lightC: 0.012, darkC: 0.020 },
  { prop: "--secondary-foreground",       lightL: 0.205, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--muted",                      lightL: 0.970, darkL: 0.250, lightC: 0.012, darkC: 0.020 },
  { prop: "--muted-foreground",           lightL: 0.556, darkL: 0.700, lightC: 0.012, darkC: 0.020 },
  { prop: "--accent",                     lightL: 0.970, darkL: 0.250, lightC: 0.012, darkC: 0.020 },
  { prop: "--accent-foreground",          lightL: 0.205, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--border",                     lightL: 0.922, darkL: 1.000, lightC: 0.010, darkC: 0.010, darkAlpha: 10 },
  { prop: "--input",                      lightL: 0.922, darkL: 1.000, lightC: 0.010, darkC: 0.010, darkAlpha: 15 },
  { prop: "--sidebar",                    lightL: 0.985, darkL: 0.160, lightC: 0.006, darkC: 0.015 },
  { prop: "--sidebar-foreground",         lightL: 0.145, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--sidebar-accent",             lightL: 0.970, darkL: 0.220, lightC: 0.012, darkC: 0.020 },
  { prop: "--sidebar-accent-foreground",  lightL: 0.205, darkL: 0.985, lightC: 0.008, darkC: 0.010 },
  { prop: "--sidebar-border",             lightL: 0.922, darkL: 1.000, lightC: 0.010, darkC: 0.010, darkAlpha: 10 },
]

// All accent-derived CSS vars (primary + neutrals) for unified cleanup
const ALL_ACCENT_PROPS = [
  "--primary", "--primary-foreground", "--primary-subtle",
  "--ring", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring",
  ...TINTED_NEUTRALS.map((e) => e.prop),
]

function applyAccentColor(hex: string | null, isDark: boolean) {
  const root = document.documentElement.style

  if (!hex) {
    for (const prop of ALL_ACCENT_PROPS) {
      root.removeProperty(prop)
    }
    return
  }

  let { l, c, h } = hexToOklch(hex)

  // Skip neutral tinting for achromatic accents (e.g. Zinc)
  const isAchromatic = c < 0.03

  if (isDark && l < 0.4) {
    l = 0.45
  } else if (!isDark && l > 0.85) {
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
  root.setProperty("--sidebar-primary-foreground", foreground)
  root.setProperty("--sidebar-ring", primary)

  // Neutral vars: tinted with accent hue at low chroma
  for (const entry of TINTED_NEUTRALS) {
    if (isAchromatic) {
      root.removeProperty(entry.prop)
      continue
    }
    const L = isDark ? entry.darkL : entry.lightL
    const C = isDark ? entry.darkC : entry.lightC
    const alpha = isDark ? entry.darkAlpha : undefined
    root.setProperty(entry.prop, oklchToCss(L, C, h, alpha))
  }
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
