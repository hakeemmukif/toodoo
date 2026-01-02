import { create } from "zustand"
import { db, generateId } from "@/db"
import type { InboxItem } from "@/lib/types"

interface InboxState {
  items: InboxItem[]
  isLoading: boolean
  error: string | null

  // Actions
  loadItems: () => Promise<void>
  addItem: (content: string) => Promise<string>
  processItem: (id: string, action: "task" | "goal" | "trash", convertedId?: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>

  // Helpers
  getUnprocessedItems: () => InboxItem[]
  getUnprocessedCount: () => number
}

export const useInboxStore = create<InboxState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await db.inboxItems.toArray()
      // Sort by capturedAt descending (newest first)
      items.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      set({ items, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load inbox items", isLoading: false })
    }
  },

  addItem: async (content: string) => {
    const id = generateId()
    const item: InboxItem = {
      id,
      content,
      capturedAt: new Date(),
    }
    await db.inboxItems.add(item)
    set((state) => ({ items: [item, ...state.items] }))
    return id
  },

  processItem: async (id: string, action: "task" | "goal" | "trash", convertedId?: string) => {
    const updates: Partial<InboxItem> = {
      processedAt: new Date(),
    }

    if (action === "trash") {
      updates.trashedAt = new Date()
    } else if (action === "task" && convertedId) {
      updates.convertedToTaskId = convertedId
    } else if (action === "goal" && convertedId) {
      updates.convertedToGoalId = convertedId
    }

    await db.inboxItems.update(id, updates)
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }))
  },

  deleteItem: async (id: string) => {
    await db.inboxItems.delete(id)
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }))
  },

  getUnprocessedItems: () => {
    return get().items.filter((item) => !item.processedAt)
  },

  getUnprocessedCount: () => {
    return get().items.filter((item) => !item.processedAt).length
  },
}))
