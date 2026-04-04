import { useState } from "react"
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useCreateCardFromTemplate } from "@/hooks/use-templates"
import { useColumns } from "@/hooks/use-columns"
import { usePrompt, useConfirm } from "@/components/shared/prompt-dialog"
import { RichTextEditor } from "@/components/card-detail/rich-text-editor"
import { ColorPicker } from "@/components/card-detail/color-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, FileText, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import type { CardTemplate } from "@/lib/tauri"

interface TemplatePanelProps {
  boardId: string
}

export function TemplatePanel({ boardId }: TemplatePanelProps) {
  const { data: templates } = useTemplates(boardId)
  const createTemplate = useCreateTemplate()
  const prompt = usePrompt()
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null)
  const [creatingFrom, setCreatingFrom] = useState<CardTemplate | null>(null)

  const handleNew = async () => {
    const name = await prompt("Template name")
    if (name) {
      createTemplate.mutate(
        { boardId, name },
        { onSuccess: (tmpl) => setEditingTemplate(tmpl) },
      )
    }
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Templates
            {templates && templates.length > 0 && (
              <span className="text-xs text-muted-foreground">({templates.length})</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xs font-medium text-muted-foreground">Card Templates</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNew}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Separator className="mb-2" />
          {!templates || templates.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No templates yet
            </p>
          ) : (
            <ScrollArea className="max-h-60">
              <div className="space-y-1">
                {templates.map((tmpl) => (
                  <TemplateItem
                    key={tmpl.id}
                    template={tmpl}
                    onEdit={() => setEditingTemplate(tmpl)}
                    onUse={() => setCreatingFrom(tmpl)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>

      {editingTemplate && (
        <TemplateEditorDialog
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {creatingFrom && (
        <CreateFromTemplateDialog
          template={creatingFrom}
          boardId={boardId}
          onClose={() => setCreatingFrom(null)}
        />
      )}
    </>
  )
}

function TemplateItem({
  template,
  onEdit,
  onUse,
}: {
  template: CardTemplate
  onEdit: () => void
  onUse: () => void
}) {
  const deleteTemplate = useDeleteTemplate()
  const confirm = useConfirm()

  return (
    <div className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-muted">
      <button onClick={onUse} className="flex-1 text-left text-sm truncate">
        {template.name}
      </button>
      <button
        onClick={onEdit}
        className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-background"
      >
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
      <button
        onClick={async () => {
          const ok = await confirm(`Delete template "${template.name}"?`)
          if (ok) deleteTemplate.mutate(template.id)
        }}
        className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  )
}

function TemplateEditorDialog({
  template,
  onClose,
}: {
  template: CardTemplate
  onClose: () => void
}) {
  const updateTemplate = useUpdateTemplate()
  const [title, setTitle] = useState(template.title)
  const [description, setDescription] = useState(template.description)
  const [color, setColor] = useState<string | null>(template.color)
  const [name, setName] = useState(template.name)

  const handleSave = () => {
    updateTemplate.mutate(
      {
        id: template.id,
        updates: {
          name: name !== template.name ? name : undefined,
          title: title !== template.title ? title : undefined,
          description: description !== template.description ? description : undefined,
          color: color !== template.color ? color : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Template saved")
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Template Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Card Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Card title..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <RichTextEditor content={description} onChange={setDescription} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTemplate.isPending}>
            {updateTemplate.isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CreateFromTemplateDialog({
  template,
  boardId,
  onClose,
}: {
  template: CardTemplate
  boardId: string
  onClose: () => void
}) {
  const { data: columns } = useColumns(boardId)
  const createCard = useCreateCardFromTemplate()
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null)

  const handleCreate = () => {
    const columnId = selectedColumnId || columns?.[0]?.id
    if (!columnId) return
    createCard.mutate(
      { templateId: template.id, columnId },
      {
        onSuccess: () => {
          toast.success("Card created from template")
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create from "{template.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Column</label>
            <div className="space-y-1">
              {columns?.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setSelectedColumnId(col.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    (selectedColumnId ?? columns?.[0]?.id) === col.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={createCard.isPending || !columns?.length}>
            {createCard.isPending ? "Creating..." : "Create Card"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
