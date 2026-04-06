import { open } from "@tauri-apps/plugin-dialog"
import { useTranslation } from "react-i18next"
import { BOARD_BACKGROUND_PRESETS } from "@/lib/constants"
import { boardApi } from "@/lib/tauri"
import { useUpdateBoard } from "@/hooks/use-boards"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Image } from "lucide-react"

interface BoardBackgroundPickerProps {
  boardId: string
  projectId: string
}

export function BoardBackgroundPicker({ boardId, projectId }: BoardBackgroundPickerProps) {
  const { t } = useTranslation("board")
  const updateBoard = useUpdateBoard(projectId)

  const selectPreset = (preset: (typeof BOARD_BACKGROUND_PRESETS)[number]) => {
    updateBoard.mutate({ id: boardId, updates: { background_type: "gradient", background_value: preset.value } })
  }

  const uploadImage = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    })
    if (file) {
      const savedPath = await boardApi.saveBackgroundImage(boardId, file as string)
      updateBoard.mutate({ id: boardId, updates: { background_type: "image", background_value: savedPath } })
    }
  }

  const removeBackground = () => {
    updateBoard.mutate({ id: boardId, updates: { background_type: null, background_value: null } })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title={t("layout:boardBackground")}>
          <Image className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <p className="text-sm font-medium">{t("background.title")}</p>
          <div className="grid grid-cols-3 gap-2">
            {BOARD_BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className="group relative h-12 rounded-md border border-border hover:ring-2 ring-primary transition-all overflow-hidden"
                style={{ background: preset.value }}
                title={t(preset.label, { ns: "board" })}
              >
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={uploadImage}>
              {t("background.uploadImage")}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={removeBackground}>
              {t("common:button.remove")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
