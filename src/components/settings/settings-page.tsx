import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { DEFAULT_ACCENT_COLORS } from "@/lib/constants"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { useCreateBackup, useLastBackupTime } from "@/hooks/use-backup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor, HardDrive, Tags, Clock } from "lucide-react"
import { TagManager } from "./tag-manager"
import { settingsApi } from "@/lib/tauri"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const BACKUP_INTERVALS = [
  { value: "1800", labelKey: "backupInterval.30min" },
  { value: "3600", labelKey: "backupInterval.1hour" },
  { value: "21600", labelKey: "backupInterval.6hours" },
  { value: "86400", labelKey: "backupInterval.daily" },
  { value: "0", labelKey: "backupInterval.manual" },
] as const

export function SettingsPage() {
  const { t, i18n } = useTranslation(["settings", "common"])
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const { data: lastBackup } = useLastBackupTime()
  const createBackup = useCreateBackup()
  const [backupInterval, setBackupInterval] = useState("3600")

  useEffect(() => {
    settingsApi.get("backup_interval_secs").then((val) => {
      if (val) setBackupInterval(val)
    })
  }, [])

  const handleIntervalChange = (value: string) => {
    setBackupInterval(value)
    settingsApi.set("backup_interval_secs", value)
  }

  const handleBackup = () => {
    createBackup.mutate(undefined, {
      onSuccess: () => toast.success(t("backupCreated")),
      onError: (err) => toast.error(t("backupFailed", { error: String(err) })),
    })
  }

  const themes = [
    { value: "light" as const, label: t("theme.light"), icon: Sun },
    { value: "dark" as const, label: t("theme.dark"), icon: Moon },
    { value: "system" as const, label: t("theme.system"), icon: Monitor },
  ]

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                className={cn("flex-1 gap-2")}
                onClick={() => setTheme(value)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>

          <Separator className="my-4" />

          <div>
            <p className="mb-2 text-sm font-medium">{t("accentColor")}</p>
            <div className="flex flex-wrap items-center gap-2">
              {DEFAULT_ACCENT_COLORS.map((hex) => (
                <button
                  key={hex}
                  onClick={() => setAccentColor(hex)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    accentColor === hex ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                />
              ))}

              <button
                onClick={() => colorInputRef.current?.click()}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs transition-transform hover:scale-110",
                  accentColor && !DEFAULT_ACCENT_COLORS.includes(accentColor)
                    ? "border-foreground scale-110"
                    : "border-dashed border-muted-foreground",
                )}
                style={
                  accentColor && !DEFAULT_ACCENT_COLORS.includes(accentColor)
                    ? { backgroundColor: accentColor }
                    : undefined
                }
                aria-label={t("customColor")}
              >
                {!(accentColor && !DEFAULT_ACCENT_COLORS.includes(accentColor)) && "+"}
              </button>
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                value={accentColor ?? "#6366f1"}
                onChange={(e) => setAccentColor(e.target.value)}
              />

              {accentColor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => setAccentColor(null)}
                >
                  {t("common:button.reset")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { value: "en", label: "English" },
              { value: "ko", label: "한국어" },
            ].map(({ value, label }) => (
              <Button
                key={value}
                variant={i18n.language === value ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => i18n.changeLanguage(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="h-4 w-4" />
            {t("tags")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("backup")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">{t("lastBackup")}</p>
              <p className="text-xs text-muted-foreground">
                {lastBackup
                  ? new Date(lastBackup).toLocaleString(i18next.language)
                  : t("noBackupsYet")}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleBackup}
              disabled={createBackup.isPending}
            >
              <HardDrive className="h-4 w-4" />
              {createBackup.isPending ? t("backingUp") : t("backupNow")}
            </Button>
          </div>

          <Separator />

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{t("backupIntervalLabel")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {BACKUP_INTERVALS.map(({ value, labelKey }) => (
                <Button
                  key={value}
                  variant={backupInterval === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleIntervalChange(value)}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-sm font-medium">{t("keyboardShortcuts")}</h3>
            <div className="space-y-4">
              {[
                {
                  group: t("shortcutGroup.global"),
                  items: [
                    ["⌘K", t("shortcuts.globalSearch")],
                    ["⌘S", t("shortcuts.manualBackup")],
                    ["⌘\\", t("shortcuts.toggleSidebar")],
                    ["⌘,", t("shortcuts.settings")],
                    ["?", t("shortcuts.showHelp")],
                    ["Esc", t("shortcuts.closeModal")],
                  ],
                },
                {
                  group: t("shortcutGroup.navigation"),
                  items: [
                    ["⌘1", t("shortcuts.goToDashboard")],
                    ["⌘2", t("shortcuts.goToUnified")],
                    ["⌘3", t("shortcuts.goToTable")],
                  ],
                },
                {
                  group: t("shortcutGroup.board"),
                  items: [
                    ["N / C", t("shortcuts.newCard")],
                    ["⌘N", t("shortcuts.newCardGlobal")],
                    ["F", t("shortcuts.focusFilter")],
                  ],
                },
              ].map(({ group, items }) => (
                <div key={group}>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{group}</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {items.map(([key, desc]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span>{desc}</span>
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
