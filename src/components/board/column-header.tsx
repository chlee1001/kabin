import { forwardRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useConfirm } from "@/components/shared/prompt-dialog"
import { MoreHorizontal, Plus, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUpdateColumn, useDeleteColumn } from "@/hooks/use-columns"
import { STATUS_CATEGORY_MAP } from "@/lib/constants"
import { ColumnEditDialog } from "./column-edit-dialog"
import type { Column, StatusCategory } from "@/lib/tauri"

interface ColumnHeaderProps {
  column: Column
  cardCount: number
  onAddCard: () => void
}

export const ColumnHeader = forwardRef<HTMLDivElement, ColumnHeaderProps>(
  function ColumnHeader({ column, cardCount, onAddCard }, ref) {
    const { t } = useTranslation(["board", "common"])
    const updateColumn = useUpdateColumn()
    const deleteColumn = useDeleteColumn()
    const statusInfo = STATUS_CATEGORY_MAP[column.status_category]
    const confirm = useConfirm()
    const [editOpen, setEditOpen] = useState(false)

    const handleEdit = (name: string, status: StatusCategory) => {
      const updates: { name?: string; status_category?: StatusCategory } = {}
      if (name !== column.name) updates.name = name
      if (status !== column.status_category) updates.status_category = status
      if (Object.keys(updates).length > 0) {
        updateColumn.mutate({ id: column.id, updates })
      }
      setEditOpen(false)
    }

    const handleDelete = async () => {
      const ok = await confirm(t("column.deleteConfirm", { name: column.name }), t("column.deleteDescription"))
      if (ok) deleteColumn.mutate(column.id)
    }

    return (
      <>
        <div
          ref={ref}
          className="column-header flex cursor-grab items-center justify-between px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: statusInfo?.color ?? "#64748b" }}
            />
            <span className="text-sm font-medium">{column.name}</span>
            <span className="text-xs text-muted-foreground">{cardCount}</span>
          </div>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddCard}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  {t("column.editColumn")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {t("common:button.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ColumnEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title={t("column.edit")}
          initialName={column.name}
          initialStatus={column.status_category}
          onSave={handleEdit}
        />
      </>
    )
  },
)
