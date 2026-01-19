import { create } from "zustand"
import { db, generateId, formatDate } from "@/db"
import type { PatternInterrupt, InterruptSchedule } from "@/lib/types"
import { DEFAULT_INTERRUPT_SCHEDULE } from "@/lib/types"
import {
  generateDailySchedule,
  needsNewSchedule,
  getNextDueInterrupt,
} from "@/services/pattern-interrupts"

interface InterruptsState {
  // Data
  todaysInterrupts: PatternInterrupt[]
  schedule: InterruptSchedule
  currentInterrupt: PatternInterrupt | null
  isLoading: boolean
  error: string | null

  // Actions
  loadTodaysInterrupts: () => Promise<void>
  loadSchedule: () => void
  ensureTodaysSchedule: () => Promise<void>
  checkForDueInterrupt: () => PatternInterrupt | null

  // Responding
  respondToInterrupt: (
    id: string,
    response: string,
    alignment?: PatternInterrupt["alignmentCheck"]
  ) => Promise<void>
  skipInterrupt: (id: string) => Promise<void>
  expandToJournal: (id: string, journalEntryId: string) => Promise<void>

  // Settings
  updateSchedule: (updates: Partial<InterruptSchedule>) => void
  toggleEnabled: () => void

  // UI
  showInterrupt: (id: string) => void
  hideInterrupt: () => void
}

// Store schedule in localStorage for persistence
const SCHEDULE_KEY = "toodoo_interrupt_schedule"

function loadScheduleFromStorage(): InterruptSchedule {
  if (typeof window === "undefined") return DEFAULT_INTERRUPT_SCHEDULE

  try {
    const stored = localStorage.getItem(SCHEDULE_KEY)
    if (stored) {
      return { ...DEFAULT_INTERRUPT_SCHEDULE, ...JSON.parse(stored) }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_INTERRUPT_SCHEDULE
}

function saveScheduleToStorage(schedule: InterruptSchedule): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
}

export const useInterruptsStore = create<InterruptsState>((set, get) => ({
  todaysInterrupts: [],
  schedule: DEFAULT_INTERRUPT_SCHEDULE,
  currentInterrupt: null,
  isLoading: false,
  error: null,

  loadTodaysInterrupts: async () => {
    set({ isLoading: true, error: null })
    try {
      const today = formatDate(new Date())
      const startOfDay = new Date(today)
      const endOfDay = new Date(today)
      endOfDay.setDate(endOfDay.getDate() + 1)

      // Get all interrupts scheduled for today
      const interrupts = await db.patternInterrupts
        .where("scheduledFor")
        .between(startOfDay, endOfDay)
        .toArray()

      set({ todaysInterrupts: interrupts, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load interrupts", isLoading: false })
    }
  },

  loadSchedule: () => {
    const schedule = loadScheduleFromStorage()
    set({ schedule })
  },

  ensureTodaysSchedule: async () => {
    const { schedule, loadTodaysInterrupts } = get()
    const today = formatDate(new Date())

    if (!needsNewSchedule(schedule, today)) {
      // Already have today's schedule
      await loadTodaysInterrupts()
      return
    }

    // Generate new schedule for today
    set({ isLoading: true })
    try {
      const newInterrupts = generateDailySchedule(schedule, new Date())

      // Save to database
      await db.patternInterrupts.bulkAdd(newInterrupts)

      // Update schedule's last scheduled date
      const updatedSchedule = { ...schedule, lastScheduledDate: today }
      saveScheduleToStorage(updatedSchedule)

      set({
        schedule: updatedSchedule,
        todaysInterrupts: newInterrupts,
        isLoading: false,
      })
    } catch (error) {
      set({ error: "Failed to generate schedule", isLoading: false })
    }
  },

  checkForDueInterrupt: () => {
    const { todaysInterrupts, currentInterrupt } = get()

    // Don't check if one is already showing
    if (currentInterrupt) return null

    return getNextDueInterrupt(todaysInterrupts)
  },

  respondToInterrupt: async (id, response, alignment) => {
    const { todaysInterrupts } = get()
    const now = new Date()

    await db.patternInterrupts.update(id, {
      response,
      respondedAt: now,
      alignmentCheck: alignment,
      updatedAt: now,
    })

    const updated = todaysInterrupts.map((i) =>
      i.id === id
        ? { ...i, response, respondedAt: now, alignmentCheck: alignment, updatedAt: now }
        : i
    )

    set({ todaysInterrupts: updated, currentInterrupt: null })
  },

  skipInterrupt: async (id) => {
    const { todaysInterrupts } = get()
    const now = new Date()

    await db.patternInterrupts.update(id, {
      skipped: true,
      updatedAt: now,
    })

    const updated = todaysInterrupts.map((i) =>
      i.id === id ? { ...i, skipped: true, updatedAt: now } : i
    )

    set({ todaysInterrupts: updated, currentInterrupt: null })
  },

  expandToJournal: async (id, journalEntryId) => {
    const { todaysInterrupts } = get()
    const now = new Date()

    await db.patternInterrupts.update(id, {
      journalEntryId,
      updatedAt: now,
    })

    const updated = todaysInterrupts.map((i) =>
      i.id === id ? { ...i, journalEntryId, updatedAt: now } : i
    )

    set({ todaysInterrupts: updated })
  },

  updateSchedule: (updates) => {
    const { schedule } = get()
    const updated = { ...schedule, ...updates }
    saveScheduleToStorage(updated)
    set({ schedule: updated })
  },

  toggleEnabled: () => {
    const { schedule } = get()
    const updated = { ...schedule, enabled: !schedule.enabled }
    saveScheduleToStorage(updated)
    set({ schedule: updated })
  },

  showInterrupt: (id) => {
    const { todaysInterrupts } = get()
    const interrupt = todaysInterrupts.find((i) => i.id === id)
    if (interrupt) {
      set({ currentInterrupt: interrupt })
    }
  },

  hideInterrupt: () => {
    set({ currentInterrupt: null })
  },
}))
