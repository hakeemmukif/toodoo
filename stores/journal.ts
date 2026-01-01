import { create } from "zustand"
import { db, generateId } from "@/db"
import type { JournalEntry, LifeAspect, GoalAlignment } from "@/lib/types"
import { analyzeSentiment, detectAspects, determineGoalAlignment } from "@/services/analysis"

interface JournalState {
  entries: JournalEntry[]
  isLoading: boolean
  error: string | null

  // Actions
  loadEntries: () => Promise<void>
  addEntry: (content: string) => Promise<string>
  updateEntry: (id: string, content: string) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  analyzeWithLLM: (id: string) => Promise<void>

  // Helpers
  getEntriesForDate: (date: string) => JournalEntry[]
  getEntriesByAspect: (aspect: LifeAspect) => JournalEntry[]
  searchEntries: (query: string) => JournalEntry[]
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

  addEntry: async (content) => {
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
}))
