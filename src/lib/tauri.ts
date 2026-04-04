import { invoke } from "@tauri-apps/api/core"

// ─── Types ───────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Board {
  id: string
  project_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
  background_type: string | null
  background_value: string | null
}

export interface Column {
  id: string
  board_id: string
  name: string
  sort_order: number
  status_category: StatusCategory
  created_at: string
  updated_at: string
}

export type StatusCategory = "todo" | "in_progress" | "done" | "other"

export interface Card {
  id: string
  column_id: string
  title: string
  description: string
  start_date: string | null
  due_date: string | null
  color: string | null
  sort_order: number
  completed: boolean
  created_at: string
  updated_at: string
}

export interface Subtask {
  id: string
  card_id: string
  title: string
  completed: boolean
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
}

export interface CardLocation {
  column_name: string
  status_category: StatusCategory
  board_id: string
  board_name: string
  project_id: string
  project_name: string
  project_color: string
}

export interface CardWithTags extends Card {
  tags: Tag[]
  subtask_total: number
  subtask_done: number
}

export interface CardUpdate {
  title?: string
  description?: string
  start_date?: string | null
  due_date?: string | null
  color?: string | null
  completed?: boolean
}

// ─── Projects ────────────────────────────────────────────

export const projectApi = {
  create: (name: string, color?: string) =>
    invoke<Project>("create_project", { name, color }),
  list: () =>
    invoke<Project[]>("get_projects"),
  update: (id: string, updates: { name?: string; color?: string; sort_order?: number }) =>
    invoke<Project>("update_project", { id, updates }),
  delete: (id: string) =>
    invoke<void>("delete_project", { id }),
}

// ─── Boards ──────────────────────────────────────────────

export const boardApi = {
  create: (projectId: string, name: string) =>
    invoke<Board>("create_board", { projectId, name }),
  get: (id: string) =>
    invoke<Board>("get_board", { id }),
  list: (projectId: string) =>
    invoke<Board[]>("get_boards", { projectId }),
  listAll: () =>
    invoke<Board[]>("get_all_boards"),
  update: (id: string, updates: { name?: string; sort_order?: number; background_type?: string | null; background_value?: string | null }) =>
    invoke<Board>("update_board", { id, updates }),
  delete: (id: string) =>
    invoke<void>("delete_board", { id }),
  saveBackgroundImage: (boardId: string, sourcePath: string) =>
    invoke<string>("save_board_background_image", { boardId, sourcePath }),
  clone: (boardId: string, newName: string, includeCards: boolean) =>
    invoke<Board>("clone_board", { boardId, newName, includeCards }),
  move: (boardId: string, targetProjectId: string) =>
    invoke<Board>("move_board", { boardId, targetProjectId }),
}

// ─── Columns ─────────────────────────────────────────────

export const columnApi = {
  create: (boardId: string, name: string, statusCategory?: StatusCategory) =>
    invoke<Column>("create_column", { boardId, name, statusCategory }),
  list: (boardId: string) =>
    invoke<Column[]>("get_columns", { boardId }),
  update: (id: string, updates: { name?: string; status_category?: StatusCategory; sort_order?: number }) =>
    invoke<Column>("update_column", { id, updates }),
  delete: (id: string) =>
    invoke<void>("delete_column", { id }),
  reorder: (boardId: string, columnIds: string[]) =>
    invoke<void>("reorder_columns", { boardId, columnIds }),
}

// ─── Cards ───────────────────────────────────────────────

export const cardApi = {
  create: (columnId: string, title: string, description?: string) =>
    invoke<Card>("create_card", { columnId, title, description }),
  list: (columnId: string) =>
    invoke<Card[]>("get_cards", { columnId }),
  listEnriched: (columnId: string) =>
    invoke<CardWithTags[]>("get_cards_enriched", { columnId }),
  get: (id: string) =>
    invoke<Card>("get_card", { id }),
  getLocation: (id: string) =>
    invoke<CardLocation>("get_card_location", { id }),
  update: (id: string, updates: CardUpdate) =>
    invoke<Card>("update_card", { id, updates }),
  delete: (id: string) =>
    invoke<void>("delete_card", { id }),
  clone: (cardId: string) =>
    invoke<Card>("clone_card", { cardId }),
  move: (cardId: string, targetColumnId: string, position: number) =>
    invoke<void>("move_card", { cardId, targetColumnId, position }),
  reorder: (columnId: string, cardIds: string[]) =>
    invoke<void>("reorder_cards", { columnId, cardIds }),
}

// ─── Subtasks ────────────────────────────────────────────

export const subtaskApi = {
  create: (cardId: string, title: string) =>
    invoke<Subtask>("create_subtask", { cardId, title }),
  list: (cardId: string) =>
    invoke<Subtask[]>("get_subtasks", { cardId }),
  update: (id: string, title?: string, completed?: boolean) =>
    invoke<Subtask>("update_subtask", { id, title, completed }),
  delete: (id: string) =>
    invoke<void>("delete_subtask", { id }),
  reorder: (cardId: string, subtaskIds: string[]) =>
    invoke<void>("reorder_subtasks", { cardId, subtaskIds }),
}

// ─── Settings ────────────────────────────────────────────

export const settingsApi = {
  get: (key: string) => invoke<string | null>("get_setting", { key }),
  set: (key: string, value: string) => invoke<void>("set_setting", { key, value }),
  delete: (key: string) => invoke<void>("delete_setting", { key }),
}

// ─── Templates ──────────────────────────────────────────

export interface CardTemplate {
  id: string
  board_id: string
  name: string
  title: string
  description: string
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export const templateApi = {
  create: (boardId: string, name: string) =>
    invoke<CardTemplate>("create_template", { boardId, name }),
  list: (boardId: string) =>
    invoke<CardTemplate[]>("get_templates", { boardId }),
  update: (id: string, updates: { name?: string; title?: string; description?: string; color?: string | null }) =>
    invoke<CardTemplate>("update_template", { id, updates }),
  delete: (id: string) =>
    invoke<void>("delete_template", { id }),
  createCard: (templateId: string, columnId: string) =>
    invoke<Card>("create_card_from_template", { templateId, columnId }),
}

// ─── Tags ────────────────────────────────────────────────

export const tagApi = {
  create: (name: string, color?: string) =>
    invoke<Tag>("create_tag", { name, color }),
  list: () =>
    invoke<Tag[]>("get_tags"),
  update: (id: string, name?: string, color?: string) =>
    invoke<Tag>("update_tag", { id, name, color }),
  delete: (id: string) =>
    invoke<void>("delete_tag", { id }),
  addToCard: (cardId: string, tagId: string) =>
    invoke<void>("add_card_tag", { cardId, tagId }),
  removeFromCard: (cardId: string, tagId: string) =>
    invoke<void>("remove_card_tag", { cardId, tagId }),
  getForCard: (cardId: string) =>
    invoke<Tag[]>("get_card_tags", { cardId }),
}
