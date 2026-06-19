import { useTranslation } from "react-i18next"
import { open } from "@tauri-apps/plugin-dialog"
import { convertFileSrc } from "@tauri-apps/api/core"
import {
  useCardAttachments,
  useAddCardAttachment,
  useDeleteCardAttachment,
} from "@/hooks/use-attachments"
import { attachmentApi, type Attachment } from "@/lib/tauri"
import { Button } from "@/components/ui/button"
import { Paperclip, X, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "bmp"]
const ACCEPT_EXTS = [
  "png", "jpg", "jpeg", "webp", "gif", "bmp",
  "pdf", "txt", "md", "csv", "rtf",
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "hwp", "hwpx",
  "zip",
]

function formatSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentList({ cardId }: { cardId: string }) {
  const { t } = useTranslation("card")
  const { data: attachments } = useCardAttachments(cardId)
  const addAttachment = useAddCardAttachment()
  const deleteAttachment = useDeleteCardAttachment()

  const handleUpload = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: t("attachmentFilter"), extensions: ACCEPT_EXTS }],
    })
    if (!selected) return
    const paths = Array.isArray(selected) ? selected : [selected]
    for (const path of paths) {
      addAttachment.mutate(
        { cardId, sourcePath: path as string },
        { onError: (e) => toast.error(String(e)) },
      )
    }
  }

  const handleOpen = (att: Attachment) => {
    attachmentApi.open(att.id).catch((e) => toast.error(String(e)))
  }

  return (
    <div className="space-y-2">
      {attachments && attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {attachments.map((att) => {
            const isImage = !!att.extension && IMAGE_EXTS.includes(att.extension)
            return (
              <div
                key={att.id}
                className="group/att relative overflow-hidden rounded-lg border border-border"
              >
                <button
                  type="button"
                  onClick={() => handleOpen(att)}
                  className="block w-full text-left"
                  title={att.original_name}
                >
                  {isImage ? (
                    <img
                      src={convertFileSrc(att.src)}
                      alt={att.original_name}
                      className="h-20 w-full bg-muted object-cover"
                      onError={(e) => {
                        // Missing file (e.g. after a DB-only backup import) → fall back to icon.
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="flex h-20 items-center justify-center bg-muted">
                      <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-1.5">
                    <p className="truncate text-[11px] font-medium">{att.original_name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(att.size_bytes)}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => deleteAttachment.mutate({ id: att.id, cardId })}
                  className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-md bg-background/80 text-muted-foreground hover:text-destructive group-hover/att:flex"
                  title={t("attachmentDelete")}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-full gap-1.5 text-xs"
        onClick={handleUpload}
        disabled={addAttachment.isPending}
      >
        {addAttachment.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Paperclip className="h-3.5 w-3.5" />
        )}
        {t("addAttachment")}
      </Button>
    </div>
  )
}
