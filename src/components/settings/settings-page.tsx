import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { DEFAULT_ACCENT_COLORS } from "@/lib/constants"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { useCreateBackup, useExportBackup, useImportBackup, useLastBackupTime } from "@/hooks/use-backup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor, HardDrive, Tags, Clock, Type, Info, Download, Upload, Keyboard, Database, Trash2 } from "lucide-react"
import { getVersion } from "@tauri-apps/api/app"
import { useQuery } from "@tanstack/react-query"
import { TagManager } from "./tag-manager"
import { settingsApi } from "@/lib/tauri"
import { seedDemoData, resetAllData } from "@/lib/seed-data"
import { useQueryClient } from "@tanstack/react-query"
import { useAppName, useSetAppName } from "@/hooks/use-app-name"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useConfirm } from "@/components/shared/prompt-dialog"

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
  const exportBackup = useExportBackup()
  const importBackup = useImportBackup()
  const [backupInterval, setBackupInterval] = useState("3600")
  const { data: appVersion } = useQuery({
    queryKey: ["app", "version"],
    queryFn: getVersion,
    staleTime: Infinity,
  })
  const { data: savedAppName } = useAppName()
  const setAppName = useSetAppName()
  const [appNameDraft, setAppNameDraft] = useState("")
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [resettingData, setResettingData] = useState(false)
  const queryClient = useQueryClient()
  const confirm = useConfirm()

  useEffect(() => {
    settingsApi.get("backup_interval_secs").then((val) => {
      if (val) setBackupInterval(val)
    })
  }, [])

  useEffect(() => {
    setAppNameDraft(savedAppName ?? "")
  }, [savedAppName])

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

  const handleExport = () => {
    exportBackup.mutate(undefined, {
      onSuccess: () => toast.success(t("exportSuccess")),
      onError: (err) => {
        if (String(err).includes("cancelled")) return
        toast.error(t("exportFailed", { error: String(err) }))
      },
    })
  }

  const handleResetData = async () => {
    const ok = await confirm(t("resetDataConfirm"), t("demoDataDesc"))
    if (!ok) return
    setResettingData(true)
    try {
      await resetAllData()
      queryClient.invalidateQueries()
      toast.success(t("resetDataSuccess"))
    } catch (err) {
      toast.error(t("resetDataFailed", { error: String(err) }))
    } finally {
      setResettingData(false)
    }
  }

  const handleSeedDemo = async () => {
    setSeedingDemo(true)
    try {
      await seedDemoData()
      queryClient.invalidateQueries()
      toast.success(t("demoDataSuccess"))
    } catch (err) {
      toast.error(t("demoDataFailed", { error: String(err) }))
    } finally {
      setSeedingDemo(false)
    }
  }

  const handleImport = () => {
    importBackup.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("importSuccess"))
        setTimeout(() => window.location.reload(), 1000)
      },
      onError: (err) => {
        if (String(err).includes("cancelled")) return
        toast.error(t("importFailed", { error: String(err) }))
      },
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
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" />
            {t("appName")}
          </CardTitle>
          <CardDescription>{t("appNameDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              value={appNameDraft}
              onChange={(e) => setAppNameDraft(e.target.value)}
              onBlur={() => {
                if (appNameDraft !== (savedAppName ?? "")) {
                  setAppName.mutate(appNameDraft)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur()
                }
              }}
              placeholder={t("appNamePlaceholder")}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {appNameDraft && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  setAppNameDraft("")
                  setAppName.mutate("")
                }}
              >
                {t("common:button.reset")}
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("appNameHint")}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("appearance")}</CardTitle>
          <CardDescription>{t("appearanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={theme === value ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-medium">{t("accentColor")}</p>
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
          <CardDescription>{t("languageDesc")}</CardDescription>
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
          <CardDescription>{t("tagsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TagManager />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("backup")}</CardTitle>
          <CardDescription>{t("backupDesc")}</CardDescription>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleExport}
                disabled={exportBackup.isPending}
              >
                <Download className="h-4 w-4" />
                {t("exportBackup")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleImport}
                disabled={importBackup.isPending}
              >
                <Upload className="h-4 w-4" />
                {t("importBackup")}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("importWarning")}</p>
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
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-4 w-4" />
            {t("keyboardShortcuts")}
          </CardTitle>
          <CardDescription>{t("keyboardShortcutsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trash2 className="h-4 w-4" />
            {t("resetData")}
          </CardTitle>
          <CardDescription>{t("resetDataConfirm")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleResetData}
            disabled={resettingData}
          >
            <Trash2 className="h-4 w-4" />
            {resettingData ? t("resettingData") : t("resetData")}
          </Button>
        </CardContent>
      </Card>

      {import.meta.env.DEV && (
        <Card className="mb-6 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              {t("demoData")}
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">DEV</span>
            </CardTitle>
            <CardDescription>{t("demoDataDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleSeedDemo}
              disabled={seedingDemo}
            >
              <Database className="h-4 w-4" />
              {seedingDemo ? t("demoDataInserting") : t("demoDataInsert")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            {t("about")}
          </CardTitle>
          <CardDescription>{t("aboutDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("about.version")}</span>
              <span className="font-mono">{appVersion ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("about.madeBy")}</span>
              <span>Chaehyeon Lee</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
