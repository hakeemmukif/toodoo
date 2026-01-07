import { create } from "zustand"
import type { GoalPlanDraft, UserContext, LifeAspect, CommittedGoalPlan } from "@/lib/types"
import {
  buildUserContext,
  analyzeGoalInput,
  refinePlan as refinePlanService,
  commitGoalPlan,
  validatePlan,
  savePlanningDraft,
  loadPlanningDraft,
  getRecentDraft,
  deletePlanningDraft,
  cleanupExpiredDrafts,
  estimateTimeCommitment,
} from "@/services/goal-planner"
import { checkOllamaConnection } from "@/services/ollama"
import { useGoalsStore } from "./goals"
import { useTasksStore } from "./tasks"

interface PlanningState {
  // State
  currentDraft: GoalPlanDraft | null
  userContext: UserContext | null
  isAnalyzing: boolean
  isRefining: boolean
  isCommitting: boolean
  isOllamaConnected: boolean
  error: string | null

  // Derived state helpers
  timeEstimate: { totalHours: number; weeklyAverage: number; dailyAverage: number } | null
  validationResult: { valid: boolean; errors: string[] } | null

  // Actions
  initializeContext: () => Promise<void>
  checkConnection: () => Promise<boolean>
  startNewPlan: (userPrompt: string, aspect: LifeAspect) => Promise<void>
  refinePlan: (feedback: string) => Promise<void>
  commitPlan: () => Promise<CommittedGoalPlan>
  resetPlan: () => void

  // Draft management
  saveDraft: () => Promise<void>
  loadDraft: (id: string) => Promise<boolean>
  loadRecentDraft: (aspect: LifeAspect) => Promise<boolean>
  discardDraft: () => Promise<void>
  cleanupDrafts: () => Promise<number>

  // Manual edits to draft
  updateYearlyGoal: (updates: Partial<GoalPlanDraft["yearlyGoal"]>) => void
  updateMonthlyItem: (index: number, updates: Partial<GoalPlanDraft["monthlyBreakdown"][0]>) => void
  updateWeeklyItem: (index: number, updates: Partial<GoalPlanDraft["weeklyBreakdown"][0]>) => void
  updateTaskItem: (index: number, updates: Partial<GoalPlanDraft["initialTasks"][0]>) => void
  removeMonthlyItem: (index: number) => void
  removeWeeklyItem: (index: number) => void
  removeTaskItem: (index: number) => void
}

export const usePlanningStore = create<PlanningState>()((set, get) => ({
  // Initial state
  currentDraft: null,
  userContext: null,
  isAnalyzing: false,
  isRefining: false,
  isCommitting: false,
  isOllamaConnected: false,
  error: null,
  timeEstimate: null,
  validationResult: null,

  // Initialize user context for personalized prompts
  initializeContext: async () => {
    try {
      const context = await buildUserContext()
      const connected = await checkOllamaConnection()
      set({ userContext: context, isOllamaConnected: connected, error: null })
    } catch (error) {
      set({ error: "Failed to initialize planning context" })
    }
  },

  // Check Ollama connection
  checkConnection: async () => {
    const connected = await checkOllamaConnection()
    set({ isOllamaConnected: connected })
    return connected
  },

  // Start a new planning session
  startNewPlan: async (userPrompt: string, aspect: LifeAspect) => {
    const { userContext, isOllamaConnected } = get()

    if (!isOllamaConnected) {
      set({ error: "Ollama is not connected. Please ensure Ollama is running." })
      return
    }

    if (!userContext) {
      await get().initializeContext()
    }

    const context = get().userContext
    if (!context) {
      set({ error: "Failed to build user context" })
      return
    }

    set({ isAnalyzing: true, error: null })

    try {
      const draft = await analyzeGoalInput(userPrompt, aspect, context)
      const timeEstimate = estimateTimeCommitment(draft)
      const validationResult = validatePlan(draft)

      set({
        currentDraft: draft,
        isAnalyzing: false,
        timeEstimate,
        validationResult,
      })

      // Auto-save draft
      await savePlanningDraft(draft)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to analyze goal",
        isAnalyzing: false
      })
    }
  },

  // Refine current plan based on feedback
  refinePlan: async (feedback: string) => {
    const { currentDraft, userContext, isOllamaConnected } = get()

    if (!currentDraft) {
      set({ error: "No plan to refine" })
      return
    }

    if (!isOllamaConnected) {
      set({ error: "Ollama is not connected" })
      return
    }

    if (!userContext) {
      set({ error: "User context not initialized" })
      return
    }

    set({ isRefining: true, error: null })

    try {
      const refinedDraft = await refinePlanService(currentDraft, feedback, userContext)
      const timeEstimate = estimateTimeCommitment(refinedDraft)
      const validationResult = validatePlan(refinedDraft)

      set({
        currentDraft: refinedDraft,
        isRefining: false,
        timeEstimate,
        validationResult,
      })

      // Auto-save draft
      await savePlanningDraft(refinedDraft)
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to refine plan",
        isRefining: false
      })
    }
  },

  // Commit the plan to the database
  commitPlan: async () => {
    const { currentDraft, validationResult } = get()

    if (!currentDraft) {
      throw new Error("No plan to commit")
    }

    // Validate before committing
    const validation = validationResult || validatePlan(currentDraft)
    if (!validation.valid) {
      throw new Error(`Plan validation failed: ${validation.errors.join(", ")}`)
    }

    set({ isCommitting: true, error: null })

    try {
      // Get store actions
      const { addYearlyGoal, addMonthlyGoal, addWeeklyGoal } = useGoalsStore.getState()
      const { addTask } = useTasksStore.getState()

      const result = await commitGoalPlan(
        currentDraft,
        addYearlyGoal,
        addMonthlyGoal,
        addWeeklyGoal,
        addTask
      )

      // Delete the draft after successful commit
      await deletePlanningDraft(currentDraft.id)

      // Reset planning state
      set({
        currentDraft: null,
        isCommitting: false,
        timeEstimate: null,
        validationResult: null,
      })

      return result
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to commit plan",
        isCommitting: false
      })
      throw error
    }
  },

  // Reset the planning session
  resetPlan: () => {
    set({
      currentDraft: null,
      error: null,
      isAnalyzing: false,
      isRefining: false,
      isCommitting: false,
      timeEstimate: null,
      validationResult: null,
    })
  },

  // Save current draft for later
  saveDraft: async () => {
    const { currentDraft } = get()
    if (currentDraft) {
      await savePlanningDraft(currentDraft)
    }
  },

  // Load a specific draft
  loadDraft: async (id: string) => {
    try {
      const draft = await loadPlanningDraft(id)
      if (draft) {
        const timeEstimate = estimateTimeCommitment(draft)
        const validationResult = validatePlan(draft)
        set({
          currentDraft: draft,
          error: null,
          timeEstimate,
          validationResult,
        })
        return true
      }
      return false
    } catch {
      set({ error: "Failed to load draft" })
      return false
    }
  },

  // Load most recent draft for an aspect
  loadRecentDraft: async (aspect: LifeAspect) => {
    try {
      const draft = await getRecentDraft(aspect)
      if (draft) {
        const timeEstimate = estimateTimeCommitment(draft)
        const validationResult = validatePlan(draft)
        set({
          currentDraft: draft,
          error: null,
          timeEstimate,
          validationResult,
        })
        return true
      }
      return false
    } catch {
      set({ error: "Failed to load recent draft" })
      return false
    }
  },

  // Discard current draft
  discardDraft: async () => {
    const { currentDraft } = get()
    if (currentDraft) {
      await deletePlanningDraft(currentDraft.id)
    }
    get().resetPlan()
  },

  // Cleanup expired drafts
  cleanupDrafts: async () => {
    return await cleanupExpiredDrafts()
  },

  // Manual edits to draft - yearly goal
  updateYearlyGoal: (updates) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedDraft = {
      ...currentDraft,
      yearlyGoal: { ...currentDraft.yearlyGoal, ...updates },
      lastModifiedAt: new Date(),
    }

    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, validationResult })
  },

  // Manual edits to draft - monthly item
  updateMonthlyItem: (index, updates) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedBreakdown = [...currentDraft.monthlyBreakdown]
    updatedBreakdown[index] = { ...updatedBreakdown[index], ...updates }

    const updatedDraft = {
      ...currentDraft,
      monthlyBreakdown: updatedBreakdown,
      lastModifiedAt: new Date(),
    }

    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, validationResult })
  },

  // Manual edits to draft - weekly item
  updateWeeklyItem: (index, updates) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedBreakdown = [...currentDraft.weeklyBreakdown]
    updatedBreakdown[index] = { ...updatedBreakdown[index], ...updates }

    const updatedDraft = {
      ...currentDraft,
      weeklyBreakdown: updatedBreakdown,
      lastModifiedAt: new Date(),
    }

    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, validationResult })
  },

  // Manual edits to draft - task item
  updateTaskItem: (index, updates) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedTasks = [...currentDraft.initialTasks]
    updatedTasks[index] = { ...updatedTasks[index], ...updates }

    const updatedDraft = {
      ...currentDraft,
      initialTasks: updatedTasks,
      lastModifiedAt: new Date(),
    }

    const timeEstimate = estimateTimeCommitment(updatedDraft)
    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, timeEstimate, validationResult })
  },

  // Remove monthly item
  removeMonthlyItem: (index) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedBreakdown = currentDraft.monthlyBreakdown.filter((_, i) => i !== index)

    const updatedDraft = {
      ...currentDraft,
      monthlyBreakdown: updatedBreakdown,
      lastModifiedAt: new Date(),
    }

    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, validationResult })
  },

  // Remove weekly item
  removeWeeklyItem: (index) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedBreakdown = currentDraft.weeklyBreakdown.filter((_, i) => i !== index)

    const updatedDraft = {
      ...currentDraft,
      weeklyBreakdown: updatedBreakdown,
      lastModifiedAt: new Date(),
    }

    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, validationResult })
  },

  // Remove task item
  removeTaskItem: (index) => {
    const { currentDraft } = get()
    if (!currentDraft) return

    const updatedTasks = currentDraft.initialTasks.filter((_, i) => i !== index)

    const updatedDraft = {
      ...currentDraft,
      initialTasks: updatedTasks,
      lastModifiedAt: new Date(),
    }

    const timeEstimate = estimateTimeCommitment(updatedDraft)
    const validationResult = validatePlan(updatedDraft)
    set({ currentDraft: updatedDraft, timeEstimate, validationResult })
  },
}))
