import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "@tanstack/react-router"
import {
  useSelectImportFile,
  usePreviewImport,
  useExecuteImport,
  type ImportSource,
  type ImportPreview,
} from "@/hooks/use-import"

export function ImportSection() {
  const { t } = useTranslation(["settings", "common"])
  const navigate = useNavigate()
  const [source, setSource] = useState<ImportSource | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const selectFile = useSelectImportFile()
  const previewImport = usePreviewImport()
  const executeImport = useExecuteImport()

  const handleSourceSelect = (s: ImportSource) => {
    setSource(s)
    setFilePath(null)
    setPreview(null)
  }

  const handleSelectFile = async () => {
    if (!source) return
    selectFile.mutate(undefined, {
      onSuccess: (path) => {
        setFilePath(path)
        previewImport.mutate(
          { path, source },
          {
            onSuccess: (p) => setPreview(p),
            onError: () => {
              setFilePath(null)
              toast.error(t("import.error.invalidFile", { source }))
            },
          },
        )
      },
      onError: (err) => {
        if (String(err).includes("cancelled")) return
      },
    })
  }

  const handleImport = () => {
    if (!filePath || !source) return
    executeImport.mutate(
      { path: filePath, source },
      {
        onSuccess: (projectId) => {
          toast.success(t("import.success", { count: preview?.board_count ?? 1 }))
          setSource(null)
          setFilePath(null)
          setPreview(null)
          navigate({ to: "/projects/$projectId", params: { projectId } })
        },
        onError: (err) => {
          toast.error(t("import.error.failed", { error: String(err) }))
        },
      },
    )
  }

  const handleReset = () => {
    setSource(null)
    setFilePath(null)
    setPreview(null)
  }

  const isLoading = previewImport.isPending || executeImport.isPending

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileUp className="h-4 w-4" />
          {t("import.title")}
        </CardTitle>
        <CardDescription>{t("import.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source selector */}
        <div>
          <p className="mb-2 text-sm font-medium">{t("import.source")}</p>
          <div className="flex gap-2">
            {(["Kanri", "Trello"] as const).map((s) => (
              <Button
                key={s}
                variant={source === s ? "default" : "outline"}
                size="sm"
                onClick={() => handleSourceSelect(s)}
                disabled={isLoading}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* File picker */}
        {source && !preview && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleSelectFile}
            disabled={isLoading}
          >
            {previewImport.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="h-4 w-4" />
            )}
            {previewImport.isPending ? t("import.analyzing") : t("import.selectFile")}
          </Button>
        )}

        {/* Preview */}
        {preview && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-medium">{t("import.preview.title")}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">{t("import.preview.project")}</span>
              <span className="font-medium">{preview.project_name}</span>
              <span className="text-muted-foreground">{t("import.preview.boards")}</span>
              <span>{preview.board_count}</span>
              <span className="text-muted-foreground">{t("import.preview.columns")}</span>
              <span>{preview.column_count}</span>
              <span className="text-muted-foreground">{t("import.preview.cards")}</span>
              <span>{preview.card_count}</span>
              <span className="text-muted-foreground">{t("import.preview.tags")}</span>
              <span>{preview.tag_count}</span>
              <span className="text-muted-foreground">{t("import.preview.subtasks")}</span>
              <span>{preview.subtask_count}</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("import.preview.tagNote")}</p>
          </div>
        )}

        {/* Action buttons */}
        {preview && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
              disabled={isLoading}
            >
              {t("common:button.cancel")}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleImport}
              disabled={isLoading}
            >
              {executeImport.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {executeImport.isPending ? t("import.importing") : t("import.confirm")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
