import { DEFAULT_ACCENT_COLORS } from "@/lib/constants"
import { useRef } from "react"
import { useTheme } from "@/components/theme-provider"
import { useCreateBackup, useLastBackupTime } from "@/hooks/use-backup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor, HardDrive, Tags } from "lucide-react"
import { TagManager } from "./tag-manager"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const { data: lastBackup } = useLastBackupTime()
  const createBackup = useCreateBackup()

  const handleBackup = () => {
    createBackup.mutate(undefined, {
      onSuccess: () => toast.success("Backup created"),
      onError: (err) => toast.error(`Backup failed: ${err}`),
    })
  }

  const themes = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ]

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
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
            <p className="mb-2 text-sm font-medium">Accent Color</p>
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
                aria-label="Custom color"
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
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tags className="h-4 w-4" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagManager />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Last backup</p>
              <p className="text-xs text-muted-foreground">
                {lastBackup
                  ? new Date(lastBackup).toLocaleString()
                  : "No backups yet"}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleBackup}
              disabled={createBackup.isPending}
            >
              <HardDrive className="h-4 w-4" />
              {createBackup.isPending ? "Backing up..." : "Backup Now"}
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="mb-1 text-sm font-medium">Keyboard Shortcuts</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {[
                ["⌘K", "Global Search"],
                ["⌘N", "New Card (current board)"],
                ["⌘S", "Manual Backup"],
                ["⌘\\", "Toggle Sidebar"],
                ["⌘,", "Settings"],
                ["Escape", "Close Modal/Palette"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span>{desc}</span>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
