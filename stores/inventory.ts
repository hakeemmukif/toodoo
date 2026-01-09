import { create } from "zustand"
import { db, generateId } from "@/db"
import type { InventoryItem, IngredientCategory, IngredientUnit } from "@/lib/types"

interface InventoryState {
  items: InventoryItem[]
  isLoading: boolean
  error: string | null

  // Actions
  loadItems: () => Promise<void>
  addItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt" | "normalizedName">) => Promise<string>
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  useIngredients: (usages: { itemId: string; amount: number }[]) => Promise<void>

  // Helpers
  getByCategory: (category: IngredientCategory) => InventoryItem[]
  searchItems: (query: string) => InventoryItem[]
  findByName: (name: string) => InventoryItem | undefined
  getExpiringSoon: (withinDays: number) => InventoryItem[]
}

// Normalize ingredient name for matching
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/s$/, "") // Remove trailing 's' (potatoes -> potato)
    .replace(/es$/, "") // tomatoes -> tomato
    .replace(/ies$/, "y") // berries -> berry
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  loadItems: async () => {
    set({ isLoading: true, error: null })
    try {
      const items = await db.inventoryItems.toArray()
      set({ items, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load inventory", isLoading: false })
    }
  },

  addItem: async (itemData) => {
    const id = generateId()
    const item: InventoryItem = {
      ...itemData,
      id,
      normalizedName: normalizeIngredientName(itemData.name),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.inventoryItems.add(item)
    set((state) => ({ items: [...state.items, item] }))
    return id
  },

  updateItem: async (id, updates) => {
    const updatedData = {
      ...updates,
      // Re-normalize if name changed
      ...(updates.name && { normalizedName: normalizeIngredientName(updates.name) }),
      updatedAt: new Date(),
    }
    await db.inventoryItems.update(id, updatedData)
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updatedData } : i)),
    }))
  },

  deleteItem: async (id) => {
    await db.inventoryItems.delete(id)
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }))
  },

  useIngredients: async (usages) => {
    const { items, updateItem, deleteItem } = get()

    for (const usage of usages) {
      const item = items.find((i) => i.id === usage.itemId)
      if (!item) continue

      const newQuantity = item.quantity - usage.amount

      if (newQuantity <= 0) {
        // Remove item if depleted
        await deleteItem(usage.itemId)
      } else {
        // Update remaining quantity
        await updateItem(usage.itemId, { quantity: newQuantity })
      }
    }
  },

  // Helpers
  getByCategory: (category) => {
    return get().items.filter((i) => i.category === category)
  },

  searchItems: (query) => {
    const normalized = normalizeIngredientName(query)
    return get().items.filter(
      (i) =>
        i.normalizedName.includes(normalized) ||
        i.name.toLowerCase().includes(query.toLowerCase())
    )
  },

  findByName: (name) => {
    const normalized = normalizeIngredientName(name)
    return get().items.find((i) => i.normalizedName === normalized)
  },

  getExpiringSoon: (withinDays) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + withinDays)
    const cutoffStr = cutoff.toISOString().split("T")[0]

    return get().items.filter(
      (i) => i.expiresAt && i.expiresAt <= cutoffStr
    ).sort((a, b) => (a.expiresAt || "").localeCompare(b.expiresAt || ""))
  },
}))
