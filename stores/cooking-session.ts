import { create } from "zustand"
import { db, generateId } from "@/db"
import type {
  CookingSession,
  CookingSessionStatus,
  SessionItem,
  CookingPhase,
  CookingBatch,
  QuickAddItem,
} from "@/lib/types"
import { optimizeCookingSession } from "@/services/cooking-optimizer"
import { groupByTemperature } from "@/services/cooking-optimizer/group-by-temperature"

interface CookingSessionState {
  // Current session being built/executed
  currentSession: CookingSession | null
  isLoading: boolean
  error: string | null

  // History
  recentSessions: CookingSession[]

  // Actions - Session lifecycle
  createSession: () => void
  loadSession: (id: string) => Promise<void>
  loadRecentSessions: () => Promise<void>
  deleteSession: (id: string) => Promise<void>

  // Actions - Item management
  addItem: (item: QuickAddItem) => void
  addItemFromRecipe: (recipeId: string, name: string, temp: number, time: number, shake: boolean) => void
  updateItem: (itemId: string, updates: Partial<SessionItem>) => void
  removeItem: (itemId: string) => void
  clearItems: () => void

  // Actions - Batch management (manual batching)
  createBatch: () => void
  deleteBatch: (batchId: string) => void
  reorderBatches: (oldIndex: number, newIndex: number) => void
  updateBatchNotes: (batchId: string, notes: string) => void
  assignItemToBatch: (itemId: string, batchId: string, index?: number) => void
  moveItemBetweenBatches: (itemId: string, fromBatchId: string | null, toBatchId: string | null, index?: number) => void
  unassignItem: (itemId: string) => void
  reorderItemsInBatch: (batchId: string, oldIndex: number, newIndex: number) => void
  toggleManualBatching: (enabled: boolean) => void
  autoSuggestBatches: () => CookingBatch[]
  applyBatchSuggestion: (batches: CookingBatch[]) => void
  getUnassignedItems: () => SessionItem[]

  // Actions - Optimization
  optimizeSession: () => void
  resetOptimization: () => void

  // Actions - Execution
  startSession: () => Promise<void>
  completeEvent: (phaseIndex: number, eventIndex: number) => void
  completePhase: (phaseIndex: number) => void
  completeSession: () => Promise<void>
  cancelSession: () => Promise<void>

  // Helpers
  getCurrentPhase: () => CookingPhase | null
  getProgress: () => { currentPhase: number; totalPhases: number; percentComplete: number }
}

export const useCookingSessionStore = create<CookingSessionState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  error: null,
  recentSessions: [],

  // Session lifecycle
  createSession: () => {
    const newSession: CookingSession = {
      id: generateId(),
      status: "planning",
      items: [],
      phases: [],
      batches: [],
      useManualBatching: false,
      totalEstimatedMinutes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set({ currentSession: newSession, error: null })
  },

  loadSession: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const session = await db.cookingSessions.get(id)
      if (session) {
        set({ currentSession: session, isLoading: false })
      } else {
        set({ error: "Session not found", isLoading: false })
      }
    } catch {
      set({ error: "Failed to load session", isLoading: false })
    }
  },

  loadRecentSessions: async () => {
    try {
      const sessions = await db.cookingSessions
        .orderBy("createdAt")
        .reverse()
        .limit(10)
        .toArray()
      set({ recentSessions: sessions })
    } catch {
      // Silent fail for history
    }
  },

  deleteSession: async (id) => {
    await db.cookingSessions.delete(id)
    set((state) => ({
      recentSessions: state.recentSessions.filter((s) => s.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession,
    }))
  },

  // Item management
  addItem: (item) => {
    const session = get().currentSession
    if (!session || session.status !== "planning") return

    const newItem: SessionItem = {
      id: generateId(),
      name: item.name,
      temperature: item.temperature,
      timeMinutes: item.timeMinutes,
      shakeHalfway: item.shakeHalfway,
    }

    set({
      currentSession: {
        ...session,
        status: "planning", // Reset to planning if was optimized
        items: [...session.items, newItem],
        phases: [], // Clear phases when items change
        updatedAt: new Date(),
      },
    })
  },

  addItemFromRecipe: (recipeId, name, temp, time, shake) => {
    const session = get().currentSession
    if (!session || session.status !== "planning") return

    const newItem: SessionItem = {
      id: generateId(),
      name,
      temperature: temp,
      timeMinutes: time,
      shakeHalfway: shake,
      sourceRecipeId: recipeId,
    }

    set({
      currentSession: {
        ...session,
        status: "planning",
        items: [...session.items, newItem],
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  updateItem: (itemId, updates) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        status: "planning", // Reset to planning
        items: session.items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  removeItem: (itemId) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        status: "planning",
        items: session.items.filter((item) => item.id !== itemId),
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  clearItems: () => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        status: "planning",
        items: [],
        phases: [],
        batches: [],
        totalEstimatedMinutes: 0,
        updatedAt: new Date(),
      },
    })
  },

  // Batch management
  createBatch: () => {
    const session = get().currentSession
    if (!session) return

    const newBatch: CookingBatch = {
      id: generateId(),
      order: session.batches.length + 1,
      itemIds: [],
    }

    set({
      currentSession: {
        ...session,
        batches: [...session.batches, newBatch],
        useManualBatching: true,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  deleteBatch: (batchId) => {
    const session = get().currentSession
    if (!session) return

    // Unassign all items from this batch
    const updatedItems = session.items.map((item) =>
      item.batchId === batchId ? { ...item, batchId: undefined } : item
    )

    // Remove batch and reorder remaining batches
    const updatedBatches = session.batches
      .filter((b) => b.id !== batchId)
      .map((b, i) => ({ ...b, order: i + 1 }))

    set({
      currentSession: {
        ...session,
        items: updatedItems,
        batches: updatedBatches,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  reorderBatches: (oldIndex, newIndex) => {
    const session = get().currentSession
    if (!session) return

    const batches = [...session.batches]
    const [moved] = batches.splice(oldIndex, 1)
    batches.splice(newIndex, 0, moved)

    // Update order numbers
    const reorderedBatches = batches.map((b, i) => ({ ...b, order: i + 1 }))

    set({
      currentSession: {
        ...session,
        batches: reorderedBatches,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  updateBatchNotes: (batchId, notes) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        batches: session.batches.map((b) =>
          b.id === batchId ? { ...b, userNotes: notes } : b
        ),
        updatedAt: new Date(),
      },
    })
  },

  assignItemToBatch: (itemId, batchId, index) => {
    const session = get().currentSession
    if (!session) return

    // Update item's batchId
    const updatedItems = session.items.map((item) =>
      item.id === itemId ? { ...item, batchId } : item
    )

    // Update batch's itemIds
    const updatedBatches = session.batches.map((batch) => {
      if (batch.id === batchId) {
        const itemIds = batch.itemIds.filter((id) => id !== itemId)
        if (index !== undefined) {
          itemIds.splice(index, 0, itemId)
        } else {
          itemIds.push(itemId)
        }
        return { ...batch, itemIds }
      }
      // Remove from other batches
      return { ...batch, itemIds: batch.itemIds.filter((id) => id !== itemId) }
    })

    set({
      currentSession: {
        ...session,
        items: updatedItems,
        batches: updatedBatches,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  moveItemBetweenBatches: (itemId, fromBatchId, toBatchId, index) => {
    const session = get().currentSession
    if (!session) return

    // Update item's batchId
    const updatedItems = session.items.map((item) =>
      item.id === itemId ? { ...item, batchId: toBatchId ?? undefined } : item
    )

    // Update batches' itemIds
    const updatedBatches = session.batches.map((batch) => {
      let itemIds = [...batch.itemIds]

      // Remove from source batch
      if (batch.id === fromBatchId) {
        itemIds = itemIds.filter((id) => id !== itemId)
      }

      // Add to target batch
      if (batch.id === toBatchId) {
        itemIds = itemIds.filter((id) => id !== itemId) // Prevent duplicates
        if (index !== undefined) {
          itemIds.splice(index, 0, itemId)
        } else {
          itemIds.push(itemId)
        }
      }

      return { ...batch, itemIds }
    })

    set({
      currentSession: {
        ...session,
        items: updatedItems,
        batches: updatedBatches,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  unassignItem: (itemId) => {
    const session = get().currentSession
    if (!session) return

    const updatedItems = session.items.map((item) =>
      item.id === itemId ? { ...item, batchId: undefined } : item
    )

    const updatedBatches = session.batches.map((batch) => ({
      ...batch,
      itemIds: batch.itemIds.filter((id) => id !== itemId),
    }))

    set({
      currentSession: {
        ...session,
        items: updatedItems,
        batches: updatedBatches,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  reorderItemsInBatch: (batchId, oldIndex, newIndex) => {
    const session = get().currentSession
    if (!session) return

    const updatedBatches = session.batches.map((batch) => {
      if (batch.id !== batchId) return batch

      const itemIds = [...batch.itemIds]
      const [moved] = itemIds.splice(oldIndex, 1)
      itemIds.splice(newIndex, 0, moved)

      return { ...batch, itemIds }
    })

    set({
      currentSession: {
        ...session,
        batches: updatedBatches,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  toggleManualBatching: (enabled) => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        useManualBatching: enabled,
        // If disabling, clear batch assignments
        ...(enabled
          ? {}
          : {
              batches: [],
              items: session.items.map((item) => ({ ...item, batchId: undefined })),
            }),
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  autoSuggestBatches: () => {
    const session = get().currentSession
    if (!session || session.items.length === 0) return []

    // Use existing temperature grouping logic
    const groups = groupByTemperature(session.items)

    return groups.map((group, index) => ({
      id: generateId(),
      order: index + 1,
      itemIds: group.items.map((item) => item.id),
      targetTemperature: group.targetTemperature,
    }))
  },

  applyBatchSuggestion: (batches) => {
    const session = get().currentSession
    if (!session) return

    // Update items with batch assignments
    const updatedItems = session.items.map((item) => {
      const batch = batches.find((b) => b.itemIds.includes(item.id))
      return { ...item, batchId: batch?.id }
    })

    set({
      currentSession: {
        ...session,
        items: updatedItems,
        batches,
        useManualBatching: true,
        status: "planning",
        phases: [],
        updatedAt: new Date(),
      },
    })
  },

  getUnassignedItems: () => {
    const session = get().currentSession
    if (!session) return []
    return session.items.filter((item) => !item.batchId)
  },

  // Optimization
  optimizeSession: () => {
    const session = get().currentSession
    if (!session || session.items.length === 0) return

    // Use manual batching mode if enabled and has batches
    const useManual = session.useManualBatching && session.batches.length > 0

    const result = useManual
      ? optimizeCookingSession(session.items, {
          mode: "manual-batches",
          batches: session.batches,
        })
      : optimizeCookingSession(session.items)

    // Update items with their phase assignments
    const updatedItems = session.items.map((item) => {
      const phase = result.phases.find((p) => p.itemIds.includes(item.id))
      if (!phase) return item

      // Find this item's events to get timing
      const addEvent = phase.events.find(
        (e) => e.eventType === "add_item" && e.itemId === item.id
      )
      const removeEvent = phase.events.find(
        (e) => e.eventType === "remove_item" && e.itemId === item.id
      )

      return {
        ...item,
        phaseId: phase.id,
        startOffsetMinutes: addEvent?.minuteOffset ?? 0,
        endOffsetMinutes: removeEvent?.minuteOffset ?? item.timeMinutes,
      }
    })

    set({
      currentSession: {
        ...session,
        status: "optimized",
        items: updatedItems,
        phases: result.phases,
        totalEstimatedMinutes: result.totalMinutes,
        updatedAt: new Date(),
      },
    })
  },

  resetOptimization: () => {
    const session = get().currentSession
    if (!session) return

    set({
      currentSession: {
        ...session,
        status: "planning",
        phases: [],
        items: session.items.map((item) => ({
          ...item,
          phaseId: undefined,
          startOffsetMinutes: undefined,
          endOffsetMinutes: undefined,
        })),
        updatedAt: new Date(),
      },
    })
  },

  // Execution
  startSession: async () => {
    const session = get().currentSession
    if (!session || session.status !== "optimized") return

    const startedSession: CookingSession = {
      ...session,
      status: "in_progress",
      currentPhaseIndex: 0,
      currentEventIndex: 0,
      startedAt: new Date(),
      updatedAt: new Date(),
    }

    await db.cookingSessions.put(startedSession)
    set({ currentSession: startedSession })
  },

  completeEvent: (phaseIndex, eventIndex) => {
    const session = get().currentSession
    if (!session || session.status !== "in_progress") return

    const updatedPhases = [...session.phases]
    if (updatedPhases[phaseIndex]?.events[eventIndex]) {
      updatedPhases[phaseIndex].events[eventIndex].completed = true
    }

    set({
      currentSession: {
        ...session,
        phases: updatedPhases,
        currentEventIndex: eventIndex + 1,
        updatedAt: new Date(),
      },
    })
  },

  completePhase: (phaseIndex) => {
    const session = get().currentSession
    if (!session || session.status !== "in_progress") return

    const updatedPhases = [...session.phases]
    if (updatedPhases[phaseIndex]) {
      updatedPhases[phaseIndex].completedAt = new Date()
    }

    const nextPhaseIndex = phaseIndex + 1
    const isLastPhase = nextPhaseIndex >= session.phases.length

    set({
      currentSession: {
        ...session,
        phases: updatedPhases,
        currentPhaseIndex: isLastPhase ? phaseIndex : nextPhaseIndex,
        currentEventIndex: 0,
        updatedAt: new Date(),
      },
    })
  },

  completeSession: async () => {
    const session = get().currentSession
    if (!session) return

    const completedSession: CookingSession = {
      ...session,
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    }

    await db.cookingSessions.put(completedSession)
    set((state) => ({
      currentSession: null,
      recentSessions: [completedSession, ...state.recentSessions].slice(0, 10),
    }))
  },

  cancelSession: async () => {
    const session = get().currentSession
    if (!session) return

    if (session.status === "in_progress") {
      // Save cancelled session
      const cancelledSession: CookingSession = {
        ...session,
        status: "cancelled",
        updatedAt: new Date(),
      }
      await db.cookingSessions.put(cancelledSession)
    }

    set({ currentSession: null })
  },

  // Helpers
  getCurrentPhase: () => {
    const session = get().currentSession
    if (!session || session.currentPhaseIndex === undefined) return null
    return session.phases[session.currentPhaseIndex] ?? null
  },

  getProgress: () => {
    const session = get().currentSession
    if (!session || session.phases.length === 0) {
      return { currentPhase: 0, totalPhases: 0, percentComplete: 0 }
    }

    const completedPhases = session.phases.filter((p) => p.completedAt).length
    const percentComplete = Math.round((completedPhases / session.phases.length) * 100)

    return {
      currentPhase: (session.currentPhaseIndex ?? 0) + 1,
      totalPhases: session.phases.length,
      percentComplete,
    }
  },
}))
