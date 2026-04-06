import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCard, useCardLocation, useUpdateCard, useDeleteCard } from "@/hooks/use-cards"
import { RichTextEditor } from "./rich-text-editor"
import { SubtaskList } from "./subtask-list"
import { TagPicker } from "./tag-picker"
import { ColorPicker } from "./color-picker"
import { DatePicker } from "./date-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { MoveCardPicker } from "./move-card-picker"
import { Trash2, Check, Calendar, Tag, Palette, MoveRight, ListTodo, AlignLeft } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useConfirm } from "@/components/shared/prompt-dialog"
import { Badge } from "@/components/ui/badge"

interface CardDetailModalProps {
  cardId: string | null
  onClose: () => void
}

export function CardDetailModal({ cardId, onClose }: CardDetailModalProps) {
  const { t } = useTranslation(["card", "common"])
  const { data: card } = useCard(cardId ?? undefined)
  const { data: location } = useCardLocation(cardId ?? undefined)
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const confirm = useConfirm()
  const [title, setTitle] = useState("")
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showSaved = () => {
    setSaved(true)
    clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1500)
  }

  useEffect(() => {
    if (card) setTitle(card.title)
  }, [card])

  const handleTitleBlur = () => {
    if (card && title.trim() && title !== card.title) {
      updateCard.mutate({ id: card.id, updates: { title: title.trim() } }, { onSuccess: showSaved })
    }
  }

  const handleDescriptionChange = (json: string) => {
    if (card) {
      updateCard.mutate({ id: card.id, updates: { description: json } }, { onSuccess: showSaved })
    }
  }

  const handleDelete = async () => {
    if (!card) return
    const ok = await confirm(t("deleteConfirm", { name: card.title }))
    if (ok) {
      deleteCard.mutate(card.id, {
        onSuccess: () => {
          toast.success(t("deleted"))
          onClose()
        },
      })
    }
  }

  if (!card) return null

  return (
    <Dialog open={!!cardId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2 pr-12">
          <DialogTitle className="sr-only">{t("detail")}</DialogTitle>
          {location && (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70 mb-2">
              <Badge variant="outline" className="h-5 px-1.5 font-normal border-muted-foreground/20">
                <div className="h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: location.project_color }} />
                {location.project_name}
              </Badge>
              <span className="opacity-40">/</span>
              <span>{location.board_name}</span>
              <span className="opacity-40">/</span>
              <span className="text-foreground/80">{location.column_name}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                placeholder={t("titlePlaceholder")}
                className="h-auto border-transparent text-2xl font-bold shadow-none hover:bg-muted/50 focus-visible:bg-transparent focus-visible:border-primary/30 focus-visible:ring-0 px-2 transition-all"
              />
            </div>
            <div className="h-6 w-[80px] flex items-center justify-end">
              {saved && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 animate-in fade-in zoom-in duration-300">
                  <Check className="h-3 w-3" />
                  <span className="text-[10px]">{t("common:saved")}</span>
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div className="grid grid-cols-[1fr_240px] gap-8">
            {/* Main Content */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
                  <AlignLeft className="h-4 w-4 text-primary" />
                  <h3>{t("description")}</h3>
                </div>
                <div className="rounded-lg border bg-card/50">
                  <RichTextEditor
                    content={card.description}
                    onChange={handleDescriptionChange}
                  />
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
                  <ListTodo className="h-4 w-4 text-primary" />
                  <h3>{t("subtasks")}</h3>
                </div>
                <SubtaskList cardId={card.id} />
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="space-y-5 rounded-xl border bg-muted/30 p-4">
                <div>
                  <label className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Calendar className="h-3.5 w-3.5" />
                    {t("timeline")}
                  </label>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground ml-1">{t("startDate")}</span>
                      <DatePicker
                        value={card.start_date}
                        onChange={(date) =>
                          updateCard.mutate({ id: card.id, updates: { start_date: date } })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground ml-1">{t("dueDate")}</span>
                      <DatePicker
                        value={card.due_date}
                        onChange={(date) =>
                          updateCard.mutate({ id: card.id, updates: { due_date: date } })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div>
                  <label className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Palette className="h-3.5 w-3.5" />
                    {t("appearance")}
                  </label>
                  <ColorPicker
                    value={card.color}
                    onChange={(color) =>
                      updateCard.mutate({ id: card.id, updates: { color } })
                    }
                  />
                </div>

                <Separator className="bg-border/50" />

                <div>
                  <label className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Tag className="h-3.5 w-3.5" />
                    {t("tags")}
                  </label>
                  <TagPicker cardId={card.id} />
                </div>

                <Separator className="bg-border/50" />

                <div>
                  <label className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    <MoveRight className="h-3.5 w-3.5" />
                    {t("move")}
                  </label>
                  <MoveCardPicker cardId={card.id} currentColumnId={card.column_id} />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full justify-start gap-2 h-9 font-medium shadow-sm"
                  onClick={() => {
                    showSaved()
                    onClose()
                  }}
                >
                  <Check className="h-4 w-4" />
                  {t("saveAndClose")}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("deleteCard")}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
