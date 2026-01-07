import { create } from "zustand"
import { persist } from "zustand/middleware"
import { db, generateId } from "@/db"
import type { ShoppingList, ShoppingItem, Priority, ItemStatus } from "@/lib/types"

interface ShoppingState {
  lists: ShoppingList[]
  items: ShoppingItem[]
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean

  // Actions
  loadLists: () => Promise<void>
  loadItems: () => Promise<void>
  setHasHydrated: (state: boolean) => void

  // Lists
  addList: (store: string) => Promise<string>
  updateList: (id: string, store: string) => Promise<void>
  deleteList: (id: string) => Promise<void>

  // Items
  addItem: (item: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemBought: (id: string) => Promise<void>
  clearBoughtItems: (listId: string) => Promise<void>

  // Helpers
  getItemsByList: (listId: string) => ShoppingItem[]
  getItemsByStore: (store: string) => ShoppingItem[]
  getOrCreateListForStore: (store: string) => Promise<string>
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      lists: [],
      items: [],
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      loadLists: async () => {
        try {
          const lists = await db.shoppingLists.toArray()
          set({ lists })
        } catch (error) {
          set({ error: "Failed to load shopping lists" })
        }
      },

      loadItems: async () => {
        set({ isLoading: true, error: null })
        try {
          const items = await db.shoppingItems.toArray()
          set({ items, isLoading: false })
        } catch (error) {
          set({ error: "Failed to load shopping items", isLoading: false })
        }
      },

      // Lists
      addList: async (store) => {
        const id = generateId()
        const list: ShoppingList = {
          id,
          store,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.shoppingLists.add(list)
        set((state) => ({ lists: [...state.lists, list] }))
        return id
      },

      updateList: async (id, store) => {
        const updatedData = { store, updatedAt: new Date() }
        await db.shoppingLists.update(id, updatedData)
        set((state) => ({
          lists: state.lists.map((l) => (l.id === id ? { ...l, ...updatedData } : l)),
        }))
      },

      deleteList: async (id) => {
        // Delete all items in the list first
        const items = get().items.filter((i) => i.listId === id)
        for (const item of items) {
          await db.shoppingItems.delete(item.id)
        }
        await db.shoppingLists.delete(id)
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== id),
          items: state.items.filter((i) => i.listId !== id),
        }))
      },

      // Items
      addItem: async (itemData) => {
        const id = generateId()
        const item: ShoppingItem = {
          ...itemData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.shoppingItems.add(item)
        set((state) => ({ items: [...state.items, item] }))
        return id
      },

      updateItem: async (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        await db.shoppingItems.update(id, updatedData)
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...updatedData } : i)),
        }))
      },

      deleteItem: async (id) => {
        await db.shoppingItems.delete(id)
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }))
      },

      toggleItemBought: async (id) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return

        const newStatus: ItemStatus = item.status === "bought" ? "pending" : "bought"
        await get().updateItem(id, { status: newStatus })
      },

      clearBoughtItems: async (listId) => {
        const boughtItems = get().items.filter(
          (i) => i.listId === listId && i.status === "bought"
        )
        for (const item of boughtItems) {
          await db.shoppingItems.delete(item.id)
        }
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.listId === listId && i.status === "bought")
          ),
        }))
      },

      // Helpers
      getItemsByList: (listId) => {
        return get().items.filter((i) => i.listId === listId)
      },

      getItemsByStore: (store) => {
        const list = get().lists.find((l) => l.store === store)
        if (!list) return []
        return get().items.filter((i) => i.listId === list.id)
      },

      getOrCreateListForStore: async (store) => {
        const existingList = get().lists.find((l) => l.store === store)
        if (existingList) return existingList.id
        return await get().addList(store)
      },
    }),
    {
      name: "shopping-storage",
      partialize: (state) => ({
        lists: state.lists,
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
