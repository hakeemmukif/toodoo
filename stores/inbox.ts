import { create } from "zustand"
import { persist } from "zustand/middleware"
import { db, generateId } from "@/db"
import type { InboxItem, ParsedResult, ClarificationState, SlotType } from "@/lib/types"
import { parseInboxItem, enhanceWithOllama, PARSER_VERSION } from "@/services/inbox-parser"
import { generateBreakdown } from "@/services/inbox-parser/breakdown-generator"
import { analyzeSlots } from "@/services/inbox-parser/slot-analyzer"
import { generateClarificationQuestions } from "@/services/inbox-parser/question-generator"
import { mergeClarifications } from "@/services/inbox-parser/confidence-scorer"

interface InboxState {
  items: InboxItem[]
  isLoading: boolean
  isParsing: boolean
  error: string | null
  _hasHydrated: boolean
  currentParsed: ParsedResult | null
  currentParsingItemId: string | null

  // Clarification state
  clarificationState: ClarificationState | null
  isClarifying: boolean
  isGeneratingQuestions: boolean

  // Ollama enhancement state
  isEnhancing: boolean
  enhancingItemId: string | null

  // Actions
  loadItems: () => Promise<void>
  addItem: (content: string) => Promise<string>
  addItemWithParse: (content: string) => Promise<{ id: string; parsed: ParsedResult | null }>
  parseItem: (id: string) => Promise<ParsedResult | null>
  updateItemParsed: (id: string, parsed: ParsedResult) => Promise<void>
  setCurrentParsed: (parsed: ParsedResult | null) => void
  processItem: (id: string, action: "task" | "goal" | "trash", convertedId?: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setHasHydrated: (state: boolean) => void

  // Clarification actions
  startClarification: (text: string, parsed: ParsedResult) => Promise<void>
  updateClarificationAnswer: (slot: SlotType, value: string) => void
  submitClarifications: () => Promise<{ parsed: ParsedResult; canProceed: boolean }>
  cancelClarification: () => void
  skipClarification: () => Promise<{ id: string; parsed: ParsedResult | null }>

  // Helpers
  getUnprocessedItems: () => InboxItem[]
  getUnprocessedCount: () => number
}

export const useInboxStore = create<InboxState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isParsing: false,
      error: null,
      _hasHydrated: false,
      currentParsed: null,
      currentParsingItemId: null,

      // Clarification initial state
      clarificationState: null,
      isClarifying: false,
      isGeneratingQuestions: false,

      // Ollama enhancement initial state
      isEnhancing: false,
      enhancingItemId: null,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      loadItems: async () => {
        set({ isLoading: true, error: null })
        try {
          const items = await db.inboxItems.toArray()
          // Sort by capturedAt descending (newest first)
          items.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
          set({ items, isLoading: false })
        } catch (error) {
          set({ error: "Failed to load inbox items", isLoading: false })
        }
      },

      addItem: async (content: string) => {
        const id = generateId()
        const item: InboxItem = {
          id,
          content,
          capturedAt: new Date(),
        }
        await db.inboxItems.add(item)
        set((state) => ({ items: [item, ...state.items] }))
        return id
      },

      addItemWithParse: async (content: string) => {
        const id = generateId()
        set({ isParsing: true, currentParsingItemId: id })

        try {
          // Parse the content
          const parsed = await parseInboxItem(content)

          // Generate breakdown if we have enough info
          if (parsed.intent?.value && parsed.confidenceLevel !== "low") {
            parsed.suggestedBreakdown = generateBreakdown(parsed.intent.value, {
              time: parsed.when?.time?.value,
              location: parsed.where?.value,
              timePreference: parsed.when?.timePreference?.value,
              totalDuration: parsed.duration?.value,
            })
          }

          const item: InboxItem = {
            id,
            content,
            capturedAt: new Date(),
            parsed,
            parseAttemptedAt: new Date(),
            parseVersion: PARSER_VERSION,
          }

          await db.inboxItems.add(item)

          // Update state with initial rule-based result
          set((state) => ({
            items: [item, ...state.items],
            isParsing: false,
            currentParsed: parsed,
            currentParsingItemId: null,
            isEnhancing: true,
            enhancingItemId: id,
          }))

          // Start async Ollama enhancement (non-blocking)
          enhanceWithOllama(
            content,
            parsed,
            async (enhanced) => {
              // Update item in database with enhanced result
              await db.inboxItems.update(id, {
                parsed: enhanced,
                parseAttemptedAt: new Date(),
              })

              // Update state with enhanced result
              // Only clear enhancing flags if this is still the active enhancing item
              set((state) => {
                const isActiveEnhancement = state.enhancingItemId === id
                return {
                  items: state.items.map((i) =>
                    i.id === id
                      ? { ...i, parsed: enhanced, parseAttemptedAt: new Date() }
                      : i
                  ),
                  // Only update currentParsed if this is still the active item
                  currentParsed: isActiveEnhancement ? enhanced : state.currentParsed,
                  // Only clear flags if this enhancement is still the active one
                  isEnhancing: isActiveEnhancement ? false : state.isEnhancing,
                  enhancingItemId: isActiveEnhancement ? null : state.enhancingItemId,
                }
              })
            }
          ).catch(() => {
            // Silent failure - only clear if this is still the active enhancement
            set((state) => {
              if (state.enhancingItemId !== id) return state
              return { isEnhancing: false, enhancingItemId: null }
            })
          })

          return { id, parsed }
        } catch (error) {
          // Fallback to adding without parse on error
          const item: InboxItem = {
            id,
            content,
            capturedAt: new Date(),
            parseAttemptedAt: new Date(),
            parseVersion: PARSER_VERSION,
          }

          await db.inboxItems.add(item)
          set((state) => ({
            items: [item, ...state.items],
            isParsing: false,
            currentParsed: null,
            currentParsingItemId: null,
          }))

          return { id, parsed: null }
        }
      },

      parseItem: async (id: string) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return null

        set({ isParsing: true, currentParsingItemId: id })

        try {
          const parsed = await parseInboxItem(item.content)

          // Generate breakdown if we have enough info
          if (parsed.intent?.value && parsed.confidenceLevel !== "low") {
            parsed.suggestedBreakdown = generateBreakdown(parsed.intent.value, {
              time: parsed.when?.time?.value,
              location: parsed.where?.value,
              timePreference: parsed.when?.timePreference?.value,
              totalDuration: parsed.duration?.value,
            })
          }

          // Update item with parsed result
          await db.inboxItems.update(id, {
            parsed,
            parseAttemptedAt: new Date(),
            parseVersion: PARSER_VERSION,
          })

          set((state) => ({
            items: state.items.map((i) =>
              i.id === id
                ? { ...i, parsed, parseAttemptedAt: new Date(), parseVersion: PARSER_VERSION }
                : i
            ),
            isParsing: false,
            currentParsed: parsed,
            currentParsingItemId: null,
          }))

          return parsed
        } catch (error) {
          set({ isParsing: false, currentParsingItemId: null })
          return null
        }
      },

      updateItemParsed: async (id: string, parsed: ParsedResult) => {
        await db.inboxItems.update(id, {
          parsed,
          parseAttemptedAt: new Date(),
          parseVersion: PARSER_VERSION,
        })

        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, parsed, parseAttemptedAt: new Date(), parseVersion: PARSER_VERSION }
              : i
          ),
        }))
      },

      setCurrentParsed: (parsed: ParsedResult | null) => {
        set({ currentParsed: parsed })
      },

      processItem: async (id: string, action: "task" | "goal" | "trash", convertedId?: string) => {
        const updates: Partial<InboxItem> = {
          processedAt: new Date(),
        }

        if (action === "trash") {
          updates.trashedAt = new Date()
        } else if (action === "task" && convertedId) {
          updates.convertedToTaskId = convertedId
        } else if (action === "goal" && convertedId) {
          updates.convertedToGoalId = convertedId
        }

        await db.inboxItems.update(id, updates)
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }))
      },

      deleteItem: async (id: string) => {
        await db.inboxItems.delete(id)
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      // Clarification actions
      startClarification: async (text: string, parsed: ParsedResult) => {
        set({ isGeneratingQuestions: true, isClarifying: true })

        try {
          const analysis = analyzeSlots(parsed)

          // Generate questions for missing slots
          const clarificationResult = await generateClarificationQuestions({
            originalText: text,
            parsed,
            analysis,
          })

          set({
            clarificationState: {
              originalText: text,
              parsed,
              analysis,
              questions: clarificationResult.questions,
              answers: {},
              generationMethod: clarificationResult.generationMethod,
            },
            isGeneratingQuestions: false,
          })
        } catch (error) {
          console.error('Failed to start clarification:', error)
          set({
            isGeneratingQuestions: false,
            isClarifying: false,
            clarificationState: null,
          })
        }
      },

      updateClarificationAnswer: (slot: SlotType, value: string) => {
        set((state) => {
          if (!state.clarificationState) return state

          return {
            clarificationState: {
              ...state.clarificationState,
              answers: {
                ...state.clarificationState.answers,
                [slot]: value,
              },
            },
          }
        })
      },

      submitClarifications: async () => {
        const state = get()
        if (!state.clarificationState) {
          return { parsed: {} as ParsedResult, canProceed: false }
        }

        const { parsed, answers } = state.clarificationState

        // Merge user answers into parsed result
        const mergedParsed = mergeClarifications(parsed, answers)

        // Re-analyze with merged data
        const newAnalysis = analyzeSlots(mergedParsed)

        // Generate breakdown if we now have enough info
        if (mergedParsed.intent?.value && newAnalysis.canProceed) {
          mergedParsed.suggestedBreakdown = generateBreakdown(mergedParsed.intent.value, {
            time: mergedParsed.when?.time?.value,
            location: mergedParsed.where?.value,
            timePreference: mergedParsed.when?.timePreference?.value,
            totalDuration: mergedParsed.duration?.value,
          })
        }

        // Update current parsed with merged result
        set({
          currentParsed: mergedParsed,
          isClarifying: false,
          clarificationState: null,
        })

        return {
          parsed: mergedParsed,
          canProceed: newAnalysis.canProceed,
        }
      },

      cancelClarification: () => {
        set({
          isClarifying: false,
          clarificationState: null,
          isGeneratingQuestions: false,
        })
      },

      skipClarification: async () => {
        const state = get()
        if (!state.clarificationState) {
          return { id: '', parsed: null }
        }

        const { originalText, parsed } = state.clarificationState

        // Save item with incomplete parsing (user chose to skip)
        const id = generateId()
        const item: InboxItem = {
          id,
          content: originalText,
          capturedAt: new Date(),
          parsed,
          parseAttemptedAt: new Date(),
          parseVersion: PARSER_VERSION,
        }

        await db.inboxItems.add(item)

        set((state) => ({
          items: [item, ...state.items],
          isClarifying: false,
          clarificationState: null,
          currentParsed: parsed,
        }))

        return { id, parsed }
      },

      getUnprocessedItems: () => {
        return get().items.filter((item) => !item.processedAt)
      },

      getUnprocessedCount: () => {
        return get().items.filter((item) => !item.processedAt).length
      },
    }),
    {
      name: "inbox-storage",
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
