import { create } from "zustand"
import { db, generateId } from "@/db"
import type { JournalEntry, LifeAspect, GoalAlignment, PromptCategory } from "@/lib/types"
import { analyzeSentiment, detectAspects, determineGoalAlignment } from "@/services/analysis"

interface GoalSentimentTrend {
  goalId: string
  entries: number
  avgSentiment: number
  recentTrend: "improving" | "declining" | "stable"
  recentEntries: JournalEntry[]
}

interface AddEntryOptions {
  content: string
  promptUsed?: string
  promptCategory?: PromptCategory
  energyLevel?: number
  sleepQuality?: number
  sleepHours?: number
  linkedGoalIds?: string[]
  goalContext?: string
}

interface JournalState {
  entries: JournalEntry[]
  isLoading: boolean
  error: string | null

  // Actions
  loadEntries: () => Promise<void>
  addEntry: (options: AddEntryOptions) => Promise<string>
  updateEntry: (id: string, content: string) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  analyzeWithLLM: (id: string) => Promise<void>

  // Helpers
  getEntriesForDate: (date: string) => JournalEntry[]
  getEntriesByAspect: (aspect: LifeAspect) => JournalEntry[]
  searchEntries: (query: string) => JournalEntry[]

  // Goal integration
  getEntriesForGoal: (goalId: string) => JournalEntry[]
  getGoalSentimentTrend: (goalId: string) => GoalSentimentTrend
  linkEntryToGoals: (entryId: string, goalIds: string[]) => Promise<void>
  unlinkEntryFromGoal: (entryId: string, goalId: string) => Promise<void>
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  loadEntries: async () => {
    set({ isLoading: true, error: null })
    try {
      const entries = await db.journalEntries.orderBy("timestamp").reverse().toArray()
      set({ entries, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load journal entries", isLoading: false })
    }
  },

  addEntry: async (options) => {
    const {
      content,
      promptUsed,
      promptCategory,
      energyLevel,
      sleepQuality,
      sleepHours,
      linkedGoalIds,
      goalContext,
    } = options

    const id = generateId()
    const timestamp = new Date()

    // Analyze the content
    const sentimentScore = analyzeSentiment(content)
    const detectedAspects = detectAspects(content)
    const goalAlignment = await determineGoalAlignment(content, sentimentScore)

    const entry: JournalEntry = {
      id,
      timestamp,
      content,
      detectedAspects,
      sentimentScore,
      goalAlignment,
      promptUsed,
      promptCategory,
      energyLevel,
      sleepQuality,
      sleepHours,
      linkedGoalIds,
      goalContext,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await db.journalEntries.add(entry)
    set((state) => ({ entries: [entry, ...state.entries] }))
    return id
  },

  updateEntry: async (id, content) => {
    const timestamp = new Date()

    // Re-analyze the content
    const sentimentScore = analyzeSentiment(content)
    const detectedAspects = detectAspects(content)
    const goalAlignment = await determineGoalAlignment(content, sentimentScore)

    const updates = {
      content,
      sentimentScore,
      detectedAspects,
      goalAlignment,
      updatedAt: timestamp,
    }

    await db.journalEntries.update(id, updates)
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }))
  },

  deleteEntry: async (id) => {
    await db.journalEntries.delete(id)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))
  },

  analyzeWithLLM: async (id) => {
    const entry = get().entries.find((e) => e.id === id)
    if (!entry) return

    try {
      // This will be implemented in the Ollama service
      const { queryOllama, checkOllamaConnection } = await import("@/services/ollama")
      const isConnected = await checkOllamaConnection()

      if (!isConnected) {
        throw new Error("Ollama not connected")
      }

      const prompt = `Analyze this journal entry and provide insights about the writer's mindset, goals, and suggestions for improvement. Keep the response brief (2-3 sentences).

Journal entry: "${entry.content}"

Provide a brief, supportive analysis:`

      const analysis = await queryOllama(prompt)

      await db.journalEntries.update(id, { llmAnalysis: analysis })
      set((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, llmAnalysis: analysis } : e
        ),
      }))
    } catch (error) {
      console.error("LLM analysis failed:", error)
    }
  },

  // Helpers
  getEntriesForDate: (date) => {
    return get().entries.filter((e) => {
      const entryDate = new Date(e.timestamp).toISOString().split("T")[0]
      return entryDate === date
    })
  },

  getEntriesByAspect: (aspect) => {
    return get().entries.filter((e) => e.detectedAspects.includes(aspect))
  },

  searchEntries: (query) => {
    const lowerQuery = query.toLowerCase()
    return get().entries.filter(
      (e) =>
        e.content.toLowerCase().includes(lowerQuery) ||
        e.detectedAspects.some((a) => a.includes(lowerQuery))
    )
  },

  // Goal integration methods
  getEntriesForGoal: (goalId) => {
    return get().entries.filter(
      (e) => e.linkedGoalIds?.includes(goalId) || e.goalContext === goalId
    )
  },

  getGoalSentimentTrend: (goalId) => {
    const entries = get().getEntriesForGoal(goalId)

    if (entries.length === 0) {
      return {
        goalId,
        entries: 0,
        avgSentiment: 0,
        recentTrend: "stable" as const,
        recentEntries: [],
      }
    }

    // Calculate average sentiment
    const avgSentiment =
      entries.reduce((sum, e) => sum + e.sentimentScore, 0) / entries.length

    // Get recent entries sorted by date
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const recentEntries = sortedEntries.slice(0, 5)

    // Calculate trend from recent entries
    let recentTrend: "improving" | "declining" | "stable" = "stable"
    if (recentEntries.length >= 3) {
      const recentAvg =
        recentEntries.slice(0, 3).reduce((sum, e) => sum + e.sentimentScore, 0) / 3
      const olderAvg =
        recentEntries.length > 3
          ? recentEntries.slice(3).reduce((sum, e) => sum + e.sentimentScore, 0) /
            (recentEntries.length - 3)
          : avgSentiment

      if (recentAvg > olderAvg + 0.1) {
        recentTrend = "improving"
      } else if (recentAvg < olderAvg - 0.1) {
        recentTrend = "declining"
      }
    }

    return {
      goalId,
      entries: entries.length,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      recentTrend,
      recentEntries,
    }
  },

  linkEntryToGoals: async (entryId, goalIds) => {
    const entry = get().entries.find((e) => e.id === entryId)
    if (!entry) return

    const existingIds = entry.linkedGoalIds || []
    const newLinkedGoalIds = [...new Set([...existingIds, ...goalIds])]

    await db.journalEntries.update(entryId, {
      linkedGoalIds: newLinkedGoalIds,
      updatedAt: new Date(),
    })
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? { ...e, linkedGoalIds: newLinkedGoalIds, updatedAt: new Date() }
          : e
      ),
    }))
  },

  unlinkEntryFromGoal: async (entryId, goalId) => {
    const entry = get().entries.find((e) => e.id === entryId)
    if (!entry || !entry.linkedGoalIds) return

    const newLinkedGoalIds = entry.linkedGoalIds.filter((id) => id !== goalId)

    await db.journalEntries.update(entryId, {
      linkedGoalIds: newLinkedGoalIds.length > 0 ? newLinkedGoalIds : undefined,
      updatedAt: new Date(),
    })
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              linkedGoalIds: newLinkedGoalIds.length > 0 ? newLinkedGoalIds : undefined,
              updatedAt: new Date(),
            }
          : e
      ),
    }))
  },
}))
