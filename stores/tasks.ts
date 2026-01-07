import { create } from "zustand"
import { persist } from "zustand/middleware"
import { db, generateId, formatDate } from "@/db"
import type { Task, RecurrenceTemplate, LifeAspect, TaskStatus, TimePreference } from "@/lib/types"

interface TasksState {
  tasks: Task[]
  recurrenceTemplates: RecurrenceTemplate[]
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean

  // Actions
  loadTasks: () => Promise<void>
  loadRecurrenceTemplates: () => Promise<void>
  setHasHydrated: (state: boolean) => void

  // Tasks
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  skipTask: (id: string) => Promise<void>
  deferTask: (id: string, newDate: string) => Promise<void>

  // Recurrence Templates
  addRecurrenceTemplate: (template: Omit<RecurrenceTemplate, "id" | "createdAt">) => Promise<string>
  updateRecurrenceTemplate: (id: string, updates: Partial<RecurrenceTemplate>) => Promise<void>
  deleteRecurrenceTemplate: (id: string) => Promise<void>
  generateRecurringTasks: () => Promise<void>

  // Helpers
  getTasksForDate: (date: string) => Task[]
  getTasksByAspect: (aspect: LifeAspect) => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      recurrenceTemplates: [],
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      loadTasks: async () => {
        set({ isLoading: true, error: null })
        try {
          const tasks = await db.tasks.toArray()
          set({ tasks, isLoading: false })
        } catch (error) {
          set({ error: "Failed to load tasks", isLoading: false })
        }
      },

      loadRecurrenceTemplates: async () => {
        try {
          const templates = await db.recurrenceTemplates.toArray()
          set({ recurrenceTemplates: templates })
        } catch (error) {
          set({ error: "Failed to load recurrence templates" })
        }
      },

      addTask: async (taskData) => {
        const id = generateId()
        const task: Task = {
          ...taskData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.tasks.add(task)
        set((state) => ({ tasks: [...state.tasks, task] }))
        return id
      },

      updateTask: async (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        await db.tasks.update(id, updatedData)
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updatedData } : t)),
        }))
      },

      deleteTask: async (id) => {
        await db.tasks.delete(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
      },

      completeTask: async (id) => {
        await get().updateTask(id, {
          status: "done",
          completedAt: new Date(),
        })
      },

      skipTask: async (id) => {
        await get().updateTask(id, { status: "skipped" })
      },

      deferTask: async (id, newDate) => {
        const task = get().tasks.find((t) => t.id === id)
        if (task) {
          await get().updateTask(id, {
            status: "deferred",
            scheduledDate: newDate,
            deferCount: task.deferCount + 1,
          })
        }
      },

      // Recurrence Templates
      addRecurrenceTemplate: async (templateData) => {
        const id = generateId()
        const template: RecurrenceTemplate = {
          ...templateData,
          id,
          createdAt: new Date(),
        }
        await db.recurrenceTemplates.add(template)
        set((state) => ({
          recurrenceTemplates: [...state.recurrenceTemplates, template],
        }))
        return id
      },

      updateRecurrenceTemplate: async (id, updates) => {
        await db.recurrenceTemplates.update(id, updates)
        set((state) => ({
          recurrenceTemplates: state.recurrenceTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
      },

      deleteRecurrenceTemplate: async (id) => {
        await db.recurrenceTemplates.delete(id)
        set((state) => ({
          recurrenceTemplates: state.recurrenceTemplates.filter((t) => t.id !== id),
        }))
      },

      generateRecurringTasks: async () => {
        // Use filter instead of .equals(1) for boolean - more semantic and type-safe
        const allTemplates = await db.recurrenceTemplates.toArray()
        const templates = allTemplates.filter((t) => t.isActive)
        const today = new Date()
        const endOfWeek = new Date(today)
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()))

        for (const template of templates) {
          const existingTasks = await db.tasks
            .where("recurrenceTemplateId")
            .equals(template.id)
            .toArray()

          const scheduledDates = existingTasks.map((t) => t.scheduledDate)

          // Generate dates based on frequency
          const datesToGenerate: string[] = []
          const current = new Date(today)

          while (current <= endOfWeek) {
            const dateStr = formatDate(current)
            const dayOfWeek = current.getDay()

            let shouldGenerate = false

            switch (template.frequency) {
              case "daily":
                shouldGenerate = true
                break
              case "weekly":
                shouldGenerate = template.daysOfWeek?.includes(dayOfWeek) ?? false
                break
              case "biweekly":
                // Biweekly using anchor date for consistent behavior across years
                const anchorDate = template.biweeklyStartDate
                  ? new Date(template.biweeklyStartDate)
                  : template.createdAt
                const daysSinceAnchor = Math.floor(
                  (current.getTime() - anchorDate.getTime()) / (24 * 60 * 60 * 1000)
                )
                const weeksSinceAnchor = Math.floor(daysSinceAnchor / 7)
                shouldGenerate =
                  weeksSinceAnchor % 2 === 0 && (template.daysOfWeek?.includes(dayOfWeek) ?? false)
                break
              case "monthly":
                // Monthly on configurable day of month (defaults to 1st)
                const targetDay = template.dayOfMonth ?? 1
                // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
                const lastDayOfMonth = new Date(
                  current.getFullYear(),
                  current.getMonth() + 1,
                  0
                ).getDate()
                const effectiveDay = Math.min(targetDay, lastDayOfMonth)
                shouldGenerate = current.getDate() === effectiveDay
                break
            }

            if (shouldGenerate && !scheduledDates.includes(dateStr)) {
              datesToGenerate.push(dateStr)
            }

            current.setDate(current.getDate() + 1)
          }

          // Create tasks for missing dates
          for (const date of datesToGenerate) {
            await get().addTask({
              title: template.title,
              aspect: template.aspect,
              scheduledDate: date,
              timePreference: template.timePreference,
              hardScheduledTime: template.hardScheduledTime,
              durationEstimate: template.durationEstimate,
              recurrenceTemplateId: template.id,
              weeklyGoalId: template.linkedGoalId,
              minimumVersion: template.minimumVersion,
              status: "pending",
              deferCount: 0,
            })
          }
        }
      },

      // Helpers
      getTasksForDate: (date) => {
        return get().tasks.filter((t) => t.scheduledDate === date)
      },

      getTasksByAspect: (aspect) => {
        return get().tasks.filter((t) => t.aspect === aspect)
      },

      getTasksByStatus: (status) => {
        return get().tasks.filter((t) => t.status === status)
      },
    }),
    {
      name: "tasks-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        recurrenceTemplates: state.recurrenceTemplates,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
