import { create } from "zustand"
import { db, generateId } from "@/db"
import type { EmergentVision, DailyExcavation, ExcavationTheme } from "@/lib/types"
import { aggregateExcavationsToVision } from "@/services/vision-aggregation"

interface VisionState {
  emergentVision: EmergentVision | null
  isLoading: boolean
  error: string | null

  // Actions
  loadVision: () => Promise<void>
  aggregateFromExcavations: () => Promise<void>
  updateSummary: (field: 'visionSummary' | 'antiVisionSummary' | 'identityStatement', value: string) => Promise<void>
  addConstraint: (constraint: string) => Promise<void>
  removeConstraint: (index: number) => Promise<void>
  getVisionSnippet: () => string | null
}

export const useVisionStore = create<VisionState>((set, get) => ({
  emergentVision: null,
  isLoading: false,
  error: null,

  loadVision: async () => {
    set({ isLoading: true, error: null })
    try {
      // EmergentVision is a singleton - only one active vision
      const vision = await db.emergentVision.toCollection().first()
      set({ emergentVision: vision || null, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load vision", isLoading: false })
    }
  },

  aggregateFromExcavations: async () => {
    set({ isLoading: true, error: null })
    try {
      // Get all completed excavations
      const excavations = await db.dailyExcavations
        .where("isComplete")
        .equals(1) // Dexie uses 1 for true
        .toArray()

      if (excavations.length === 0) {
        set({ isLoading: false })
        return
      }

      // Aggregate excavation responses into vision
      const aggregated = aggregateExcavationsToVision(excavations)
      const now = new Date()

      // Check if vision exists
      const existing = await db.emergentVision.toCollection().first()

      if (existing) {
        // Update existing vision, preserving user-written summaries
        const updated: EmergentVision = {
          ...existing,
          antiVisionStatements: aggregated.antiVisionStatements,
          visionStatements: aggregated.visionStatements,
          identityWins: aggregated.identityWins,
          brokenRules: aggregated.brokenRules,
          lastUpdatedFromExcavation: now,
          excavationCount: excavations.length,
          updatedAt: now,
        }
        await db.emergentVision.update(existing.id, {
          antiVisionStatements: aggregated.antiVisionStatements,
          visionStatements: aggregated.visionStatements,
          identityWins: aggregated.identityWins,
          brokenRules: aggregated.brokenRules,
          lastUpdatedFromExcavation: now,
          excavationCount: excavations.length,
          updatedAt: now,
        })
        set({ emergentVision: updated, isLoading: false })
      } else {
        // Create new vision
        const newVision: EmergentVision = {
          id: generateId(),
          antiVisionStatements: aggregated.antiVisionStatements,
          visionStatements: aggregated.visionStatements,
          identityWins: aggregated.identityWins,
          brokenRules: aggregated.brokenRules,
          constraints: [],
          lastUpdatedFromExcavation: now,
          excavationCount: excavations.length,
          createdAt: now,
          updatedAt: now,
        }
        await db.emergentVision.add(newVision)
        set({ emergentVision: newVision, isLoading: false })
      }
    } catch (error) {
      set({ error: "Failed to aggregate excavations", isLoading: false })
    }
  },

  updateSummary: async (field, value) => {
    const { emergentVision } = get()
    if (!emergentVision) return

    const now = new Date()
    const updated: EmergentVision = {
      ...emergentVision,
      [field]: value,
      updatedAt: now,
    }

    // Update DB with explicit field assignment
    if (field === 'visionSummary') {
      await db.emergentVision.update(emergentVision.id, { visionSummary: value, updatedAt: now })
    } else if (field === 'antiVisionSummary') {
      await db.emergentVision.update(emergentVision.id, { antiVisionSummary: value, updatedAt: now })
    } else if (field === 'identityStatement') {
      await db.emergentVision.update(emergentVision.id, { identityStatement: value, updatedAt: now })
    }

    set({ emergentVision: updated })
  },

  addConstraint: async (constraint) => {
    const { emergentVision } = get()
    if (!emergentVision) return

    const now = new Date()
    const newConstraints = [...emergentVision.constraints, constraint]
    const updated = {
      ...emergentVision,
      constraints: newConstraints,
      updatedAt: now,
    }

    await db.emergentVision.update(emergentVision.id, {
      constraints: newConstraints,
      updatedAt: now,
    })

    set({ emergentVision: updated })
  },

  removeConstraint: async (index) => {
    const { emergentVision } = get()
    if (!emergentVision) return

    const now = new Date()
    const newConstraints = emergentVision.constraints.filter((_, i) => i !== index)
    const updated = {
      ...emergentVision,
      constraints: newConstraints,
      updatedAt: now,
    }

    await db.emergentVision.update(emergentVision.id, {
      constraints: newConstraints,
      updatedAt: now,
    })

    set({ emergentVision: updated })
  },

  getVisionSnippet: () => {
    const { emergentVision } = get()
    if (!emergentVision) return null

    // Return the user-written summary if available, otherwise first vision statement
    if (emergentVision.visionSummary) {
      return emergentVision.visionSummary
    }
    if (emergentVision.visionStatements.length > 0) {
      return emergentVision.visionStatements[0]
    }
    return null
  },
}))
