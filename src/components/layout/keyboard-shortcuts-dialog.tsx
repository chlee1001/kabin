import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ShortcutEntry {
  keys: string[]
  descKey: string
}

interface ShortcutGroup {
  titleKey: string
  shortcuts: ShortcutEntry[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: "shortcutGroup.global",
    shortcuts: [
      { keys: ["⌘", "K"], descKey: "shortcuts.globalSearch" },
      { keys: ["⌘", "S"], descKey: "shortcuts.manualBackup" },
      { keys: ["⌘", "\\"], descKey: "shortcuts.toggleSidebar" },
      { keys: ["⌘", ","], descKey: "shortcuts.settings" },
      { keys: ["?"], descKey: "shortcuts.showHelp" },
      { keys: ["Esc"], descKey: "shortcuts.closeModal" },
    ],
  },
  {
    titleKey: "shortcutGroup.navigation",
    shortcuts: [
      { keys: ["⌘", "1"], descKey: "shortcuts.goToDashboard" },
      { keys: ["⌘", "2"], descKey: "shortcuts.goToUnified" },
      { keys: ["⌘", "3"], descKey: "shortcuts.goToTable" },
    ],
  },
  {
    titleKey: "shortcutGroup.board",
    shortcuts: [
      { keys: ["N"], descKey: "shortcuts.newCard" },
      { keys: ["C"], descKey: "shortcuts.newCardAlt" },
      { keys: ["⌘", "N"], descKey: "shortcuts.newCardGlobal" },
      { keys: ["F"], descKey: "shortcuts.focusFilter" },
    ],
  },
]

export function KeyboardShortcutsDialog() {
  const { t } = useTranslation("settings")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener("kanban:shortcuts-help", handler)
    return () => window.removeEventListener("kanban:shortcuts-help", handler)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0">
        <DialogTitle className="px-4 pt-4 text-base font-semibold">
          {t("keyboardShortcuts")}
        </DialogTitle>
        <ScrollArea className="max-h-[60vh] px-4 pb-4">
          <div className="space-y-4">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.titleKey}>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t(group.titleKey)}
                </h3>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.descKey}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{t(shortcut.descKey)}</span>
                      <div className="flex items-center gap-0.5">
                        {shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-[11px] font-medium"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
