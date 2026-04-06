import { useState, useCallback, createContext, useContext } from "react"
import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type PromptFn = (title: string, defaultValue?: string) => Promise<string | null>
type ConfirmFn = (title: string, description?: string) => Promise<boolean>

const DialogContext = createContext<{ prompt: PromptFn; confirm: ConfirmFn } | null>(null)

export function usePrompt(): PromptFn {
  const ctx = useContext(DialogContext)
  return useCallback(
    (title: string, defaultValue?: string) =>
      ctx ? ctx.prompt(title, defaultValue) : Promise.resolve(null),
    [ctx],
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(DialogContext)
  return useCallback(
    (title: string, description?: string) =>
      ctx ? ctx.confirm(title, description) : Promise.resolve(false),
    [ctx],
  )
}

interface PromptState {
  type: "prompt"
  title: string
  defaultValue: string
  resolve: (value: string | null) => void
}

interface ConfirmState {
  type: "confirm"
  title: string
  description: string
  resolve: (value: boolean) => void
}

type DialogState = PromptState | ConfirmState | null

export function PromptDialogProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation("common")
  const [state, setState] = useState<DialogState>(null)
  const [inputValue, setInputValue] = useState("")

  const prompt: PromptFn = useCallback((title, defaultValue = "") => {
    return new Promise<string | null>((resolve) => {
      setInputValue(defaultValue)
      setState({ type: "prompt", title, defaultValue, resolve })
    })
  }, [])

  const confirm: ConfirmFn = useCallback((title, description = "") => {
    return new Promise<boolean>((resolve) => {
      setState({ type: "confirm", title, description, resolve })
    })
  }, [])

  const handleClose = () => {
    if (state?.type === "prompt") state.resolve(null)
    if (state?.type === "confirm") state.resolve(false)
    setState(null)
  }

  const handleOk = () => {
    if (state?.type === "prompt") state.resolve(inputValue.trim() || null)
    if (state?.type === "confirm") state.resolve(true)
    setState(null)
  }

  return (
    <DialogContext value={{ prompt, confirm }}>
      {children}
      <Dialog open={!!state} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{state?.title}</DialogTitle>
            {state?.type === "confirm" && state.description && (
              <DialogDescription>{state.description}</DialogDescription>
            )}
          </DialogHeader>
          {state?.type === "prompt" && (
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOk()}
              autoFocus
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>{t("button.cancel")}</Button>
            <Button
              onClick={handleOk}
              variant={state?.type === "confirm" ? "destructive" : "default"}
            >
              {state?.type === "confirm" ? t("button.delete") : t("button.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext>
  )
}
