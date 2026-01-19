import { create } from "zustand"
import { db, generateId, formatDate } from "@/db"
import type { DailyExcavation, ExcavationResponse, ExcavationTheme } from "@/lib/types"
import { getThemeForDate, getPromptsForTheme, getTotalPromptsForTheme } from "@/services/excavation"
import { useVisionStore } from "@/stores/vision"

interface ExcavationState {
  // Current session
  todaysExcavation: DailyExcavation | null
  isLoading: boolean
  error: string | null

  // Actions
  loadTodaysExcavation: () => Promise<void>
  startTodaysExcavation: () => Promise<DailyExcavation>

  // Responding to prompts
  saveResponse: (promptId: string, question: string, answer: string) => Promise<void>
  skipPrompt: (promptId: string, question: string) => Promise<void>

  // Completion
  completeExcavation: (insight?: string) => Promise<void>

  // Helpers
  hasTodaysExcavation: () => boolean
  isTodaysExcavationComplete: () => boolean
  getTodaysTheme: () => ExcavationTheme
  getCurrentPromptIndex: () => number
  getTotalPrompts: () => number
}

export const useExcavationStore = create<ExcavationState>((set, get) => ({
  todaysExcavation: null,
  isLoading: false,
  error: null,

  loadTodaysExcavation: async () => {
    set({ isLoading: true, error: null })
    try {
      const today = formatDate(new Date())
      const excavation = await db.dailyExcavations
        .where("date")
        .equals(today)
        .first()

      set({ todaysExcavation: excavation || null, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load today's excavation", isLoading: false })
    }
  },

  startTodaysExcavation: async () => {
    const today = formatDate(new Date())
    const theme = getThemeForDate(new Date())
    const now = new Date()

    const excavation: DailyExcavation = {
      id: generateId(),
      date: today,
      theme,
      currentPromptIndex: 0,
      isComplete: false,
      startedAt: now,
      lastActiveAt: now,
      responses: [],
      createdAt: now,
      updatedAt: now,
    }

    await db.dailyExcavations.add(excavation)
    set({ todaysExcavation: excavation })
    return excavation
  },

  saveResponse: async (promptId, question, answer) => {
    const { todaysExcavation } = get()
    if (!todaysExcavation) return

    const response: ExcavationResponse = {
      promptId,
      question,
      answer,
      answeredAt: new Date(),
      skipped: false,
    }

    const updatedResponses = [...todaysExcavation.responses, response]
    const now = new Date()
    const updatedExcavation: DailyExcavation = {
      ...todaysExcavation,
      responses: updatedResponses,
      lastActiveAt: now,
      currentPromptIndex: todaysExcavation.currentPromptIndex + 1,
      updatedAt: now,
    }

    await db.dailyExcavations.update(todaysExcavation.id, {
      responses: updatedResponses,
      lastActiveAt: now,
      currentPromptIndex: updatedExcavation.currentPromptIndex,
      updatedAt: now,
    })

    set({ todaysExcavation: updatedExcavation })
  },

  skipPrompt: async (promptId, question) => {
    const { todaysExcavation } = get()
    if (!todaysExcavation) return

    const response: ExcavationResponse = {
      promptId,
      question,
      answer: "",
      answeredAt: new Date(),
      skipped: true,
    }

    const updatedResponses = [...todaysExcavation.responses, response]
    const now = new Date()
    const updatedExcavation: DailyExcavation = {
      ...todaysExcavation,
      responses: updatedResponses,
      lastActiveAt: now,
      currentPromptIndex: todaysExcavation.currentPromptIndex + 1,
      updatedAt: now,
    }

    await db.dailyExcavations.update(todaysExcavation.id, {
      responses: updatedResponses,
      lastActiveAt: now,
      currentPromptIndex: updatedExcavation.currentPromptIndex,
      updatedAt: now,
    })

    set({ todaysExcavation: updatedExcavation })
  },

  completeExcavation: async (insight) => {
    const { todaysExcavation } = get()
    if (!todaysExcavation) return

    const now = new Date()
    const updatedExcavation: DailyExcavation = {
      ...todaysExcavation,
      isComplete: true,
      completedAt: now,
      insight,
      updatedAt: now,
    }

    await db.dailyExcavations.update(todaysExcavation.id, {
      isComplete: true,
      completedAt: now,
      insight,
      updatedAt: now,
    })

    set({ todaysExcavation: updatedExcavation })

    // Trigger vision aggregation after excavation complete
    // This updates the emergent vision with new excavation data
    useVisionStore.getState().aggregateFromExcavations()
  },

  // Helpers
  hasTodaysExcavation: () => {
    return get().todaysExcavation !== null
  },

  isTodaysExcavationComplete: () => {
    const { todaysExcavation } = get()
    return todaysExcavation?.isComplete ?? false
  },

  getTodaysTheme: () => {
    return getThemeForDate(new Date())
  },

  getCurrentPromptIndex: () => {
    const { todaysExcavation } = get()
    return todaysExcavation?.currentPromptIndex ?? 0
  },

  getTotalPrompts: () => {
    const theme = getThemeForDate(new Date())
    return getTotalPromptsForTheme(theme)
  },
}))
