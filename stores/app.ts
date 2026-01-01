import { create } from "zustand"
import { db, initializeDb } from "@/db"
import type { AppSettings, ScheduleBlock } from "@/lib/types"

interface AppState {
  settings: AppSettings | null
  scheduleBlocks: ScheduleBlock[]
  isInitialized: boolean
  isLoading: boolean
  error: string | null

  // Initialization
  initialize: () => Promise<void>

  // Settings
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>

  // Schedule Blocks
  loadScheduleBlocks: () => Promise<void>
  addScheduleBlock: (block: Omit<ScheduleBlock, "id" | "createdAt">) => Promise<string>
  updateScheduleBlock: (id: string, updates: Partial<ScheduleBlock>) => Promise<void>
  deleteScheduleBlock: (id: string) => Promise<void>

  // Data Management
  exportData: () => Promise<string>
  importData: (jsonData: string) => Promise<void>
  clearAllData: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: null,
  scheduleBlocks: [],
  isInitialized: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return

    set({ isLoading: true })
    try {
      await initializeDb()
      await get().loadSettings()
      set({ isInitialized: true, isLoading: false })
    } catch (error) {
      set({ error: "Failed to initialize app", isLoading: false })
    }
  },

  loadSettings: async () => {
    try {
      const settings = await db.appSettings.get("default")
      set({ settings: settings || null })
    } catch (error) {
      set({ error: "Failed to load settings" })
    }
  },

  updateSettings: async (updates) => {
    const currentSettings = get().settings
    if (!currentSettings) return

    const updatedSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date(),
    }

    await db.appSettings.update("default", updatedSettings)
    set({ settings: updatedSettings })
  },

  loadScheduleBlocks: async () => {
    try {
      const blocks = await db.scheduleBlocks.toArray()
      set({ scheduleBlocks: blocks })
    } catch (error) {
      set({ error: "Failed to load schedule blocks" })
    }
  },

  addScheduleBlock: async (blockData) => {
    const id = crypto.randomUUID()
    const block: ScheduleBlock = {
      ...blockData,
      id,
      createdAt: new Date(),
    }
    await db.scheduleBlocks.add(block)
    set((state) => ({ scheduleBlocks: [...state.scheduleBlocks, block] }))
    return id
  },

  updateScheduleBlock: async (id, updates) => {
    await db.scheduleBlocks.update(id, updates)
    set((state) => ({
      scheduleBlocks: state.scheduleBlocks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }))
  },

  deleteScheduleBlock: async (id) => {
    await db.scheduleBlocks.delete(id)
    set((state) => ({
      scheduleBlocks: state.scheduleBlocks.filter((b) => b.id !== id),
    }))
  },

  exportData: async () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      yearlyGoals: await db.yearlyGoals.toArray(),
      monthlyGoals: await db.monthlyGoals.toArray(),
      weeklyGoals: await db.weeklyGoals.toArray(),
      tasks: await db.tasks.toArray(),
      recurrenceTemplates: await db.recurrenceTemplates.toArray(),
      journalEntries: await db.journalEntries.toArray(),
      trainingSessions: await db.trainingSessions.toArray(),
      meals: await db.meals.toArray(),
      recipes: await db.recipes.toArray(),
      shoppingLists: await db.shoppingLists.toArray(),
      shoppingItems: await db.shoppingItems.toArray(),
      scheduleBlocks: await db.scheduleBlocks.toArray(),
      settings: await db.appSettings.get("default"),
    }
    return JSON.stringify(data, null, 2)
  },

  importData: async (jsonData) => {
    try {
      const data = JSON.parse(jsonData)

      // Clear existing data first
      await get().clearAllData()

      // Import each table
      if (data.yearlyGoals?.length) await db.yearlyGoals.bulkAdd(data.yearlyGoals)
      if (data.monthlyGoals?.length) await db.monthlyGoals.bulkAdd(data.monthlyGoals)
      if (data.weeklyGoals?.length) await db.weeklyGoals.bulkAdd(data.weeklyGoals)
      if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks)
      if (data.recurrenceTemplates?.length)
        await db.recurrenceTemplates.bulkAdd(data.recurrenceTemplates)
      if (data.journalEntries?.length) await db.journalEntries.bulkAdd(data.journalEntries)
      if (data.trainingSessions?.length)
        await db.trainingSessions.bulkAdd(data.trainingSessions)
      if (data.meals?.length) await db.meals.bulkAdd(data.meals)
      if (data.recipes?.length) await db.recipes.bulkAdd(data.recipes)
      if (data.shoppingLists?.length) await db.shoppingLists.bulkAdd(data.shoppingLists)
      if (data.shoppingItems?.length) await db.shoppingItems.bulkAdd(data.shoppingItems)
      if (data.scheduleBlocks?.length) await db.scheduleBlocks.bulkAdd(data.scheduleBlocks)
      if (data.settings) {
        await db.appSettings.put({ ...data.settings, id: "default" })
      }

      // Reload settings
      await get().loadSettings()
    } catch (error) {
      throw new Error("Invalid import data format")
    }
  },

  clearAllData: async () => {
    await Promise.all([
      db.yearlyGoals.clear(),
      db.monthlyGoals.clear(),
      db.weeklyGoals.clear(),
      db.tasks.clear(),
      db.recurrenceTemplates.clear(),
      db.journalEntries.clear(),
      db.trainingSessions.clear(),
      db.meals.clear(),
      db.recipes.clear(),
      db.shoppingLists.clear(),
      db.shoppingItems.clear(),
      db.scheduleBlocks.clear(),
    ])

    // Reset settings but keep the default structure
    await db.appSettings.update("default", {
      onboardingCompleted: false,
      updatedAt: new Date(),
    })

    set({
      scheduleBlocks: [],
      settings: await db.appSettings.get("default"),
    })
  },
}))
