import { create } from "zustand"
import { persist } from "zustand/middleware"
import { db, generateId } from "@/db"
import type {
  YearlyGoal,
  MonthlyGoal,
  WeeklyGoal,
  LifeAspect,
  GoalStatus,
  GoalType,
  HabitGoal,
  MasteryGoal,
  ProjectGoal,
  OutcomeGoal,
  Milestone,
  SkillLevel,
} from "@/lib/types"

interface GoalsState {
  yearlyGoals: YearlyGoal[]
  monthlyGoals: MonthlyGoal[]
  weeklyGoals: WeeklyGoal[]
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean

  // Actions
  loadGoals: () => Promise<void>
  setHasHydrated: (state: boolean) => void

  // Yearly Goals
  addYearlyGoal: (goal: Omit<YearlyGoal, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateYearlyGoal: (id: string, updates: Partial<YearlyGoal>) => Promise<void>
  deleteYearlyGoal: (id: string) => Promise<void>

  // Monthly Goals
  addMonthlyGoal: (goal: Omit<MonthlyGoal, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateMonthlyGoal: (id: string, updates: Partial<MonthlyGoal>) => Promise<void>
  deleteMonthlyGoal: (id: string) => Promise<void>

  // Weekly Goals
  addWeeklyGoal: (goal: Omit<WeeklyGoal, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateWeeklyGoal: (id: string, updates: Partial<WeeklyGoal>) => Promise<void>
  deleteWeeklyGoal: (id: string) => Promise<void>

  // Helpers
  getGoalsByAspect: (aspect: LifeAspect) => {
    yearly: YearlyGoal[]
    monthly: MonthlyGoal[]
    weekly: WeeklyGoal[]
  }
  getGoalsByType: (type: GoalType) => YearlyGoal[]

  // Type-specific actions
  updateHabitProgress: (goalId: string, completed: boolean) => Promise<void>
  updateMasteryLevel: (goalId: string, levelId: string, achieved: boolean) => Promise<void>
  updateMilestoneStatus: (
    goalId: string,
    milestoneId: string,
    status: Milestone["status"]
  ) => Promise<void>
  updateOutcomeValue: (goalId: string, currentValue: number) => Promise<void>
  addPracticeEntry: (
    goalId: string,
    entry: { durationMinutes: number; notes?: string; skillLevelId?: string }
  ) => Promise<void>
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      yearlyGoals: [],
      monthlyGoals: [],
      weeklyGoals: [],
      isLoading: false,
      error: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state })
      },

      loadGoals: async () => {
        set({ isLoading: true, error: null })
        try {
          const [yearlyGoals, monthlyGoals, weeklyGoals] = await Promise.all([
            db.yearlyGoals.toArray(),
            db.monthlyGoals.toArray(),
            db.weeklyGoals.toArray(),
          ])
          set({ yearlyGoals, monthlyGoals, weeklyGoals, isLoading: false })
        } catch (error) {
          set({ error: "Failed to load goals", isLoading: false })
        }
      },

      // Yearly Goals
      addYearlyGoal: async (goalData) => {
        const id = generateId()
        const goal: YearlyGoal = {
          ...goalData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.yearlyGoals.add(goal)
        set((state) => ({ yearlyGoals: [...state.yearlyGoals, goal] }))
        return id
      },

      updateYearlyGoal: async (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        await db.yearlyGoals.update(id, updatedData)
        set((state) => ({
          yearlyGoals: state.yearlyGoals.map((g) =>
            g.id === id ? { ...g, ...updatedData } : g
          ),
        }))
      },

      deleteYearlyGoal: async (id) => {
        await db.yearlyGoals.delete(id)
        // Also delete child monthly goals
        const monthlyGoals = get().monthlyGoals.filter((g) => g.yearlyGoalId === id)
        for (const mg of monthlyGoals) {
          await get().deleteMonthlyGoal(mg.id)
        }
        set((state) => ({
          yearlyGoals: state.yearlyGoals.filter((g) => g.id !== id),
        }))
      },

      // Monthly Goals
      addMonthlyGoal: async (goalData) => {
        const id = generateId()
        const goal: MonthlyGoal = {
          ...goalData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.monthlyGoals.add(goal)
        set((state) => ({ monthlyGoals: [...state.monthlyGoals, goal] }))
        return id
      },

      updateMonthlyGoal: async (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        await db.monthlyGoals.update(id, updatedData)
        set((state) => ({
          monthlyGoals: state.monthlyGoals.map((g) =>
            g.id === id ? { ...g, ...updatedData } : g
          ),
        }))
      },

      deleteMonthlyGoal: async (id) => {
        await db.monthlyGoals.delete(id)
        // Also delete child weekly goals
        const weeklyGoals = get().weeklyGoals.filter((g) => g.monthlyGoalId === id)
        for (const wg of weeklyGoals) {
          await get().deleteWeeklyGoal(wg.id)
        }
        set((state) => ({
          monthlyGoals: state.monthlyGoals.filter((g) => g.id !== id),
        }))
      },

      // Weekly Goals
      addWeeklyGoal: async (goalData) => {
        const id = generateId()
        const goal: WeeklyGoal = {
          ...goalData,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        await db.weeklyGoals.add(goal)
        set((state) => ({ weeklyGoals: [...state.weeklyGoals, goal] }))
        return id
      },

      updateWeeklyGoal: async (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        await db.weeklyGoals.update(id, updatedData)
        set((state) => ({
          weeklyGoals: state.weeklyGoals.map((g) =>
            g.id === id ? { ...g, ...updatedData } : g
          ),
        }))
      },

      deleteWeeklyGoal: async (id) => {
        await db.weeklyGoals.delete(id)
        // Nullify weeklyGoalId on orphaned tasks (preserves tasks but removes link)
        await db.tasks.where("weeklyGoalId").equals(id).modify({ weeklyGoalId: undefined })
        set((state) => ({
          weeklyGoals: state.weeklyGoals.filter((g) => g.id !== id),
        }))
      },

      // Helpers
      getGoalsByAspect: (aspect) => {
        const state = get()
        return {
          yearly: state.yearlyGoals.filter((g) => g.aspect === aspect),
          monthly: state.monthlyGoals.filter((g) => g.aspect === aspect),
          weekly: state.weeklyGoals.filter((g) => g.aspect === aspect),
        }
      },

      getGoalsByType: (type) => {
        return get().yearlyGoals.filter((g) => g.goalType === type)
      },

      // Type-specific actions

      // Habit: Update streak on task completion
      updateHabitProgress: async (goalId, completed) => {
        const goal = get().yearlyGoals.find((g) => g.id === goalId)
        if (!goal?.habit) return

        const habit = { ...goal.habit }
        if (completed) {
          habit.currentStreak += 1
          if (habit.currentStreak > habit.longestStreak) {
            habit.longestStreak = habit.currentStreak
          }
        } else {
          // Don't reset on single miss, only on double miss ("never miss twice")
          // This is handled externally based on consecutive misses
        }

        await get().updateYearlyGoal(goalId, { habit })
      },

      // Mastery: Mark skill level as achieved
      updateMasteryLevel: async (goalId, levelId, achieved) => {
        const goal = get().yearlyGoals.find((g) => g.id === goalId)
        if (!goal?.mastery) return

        const mastery = { ...goal.mastery }
        mastery.skillLevels = mastery.skillLevels.map((level) =>
          level.id === levelId
            ? { ...level, achieved, achievedAt: achieved ? new Date() : undefined }
            : level
        )

        // Update current level to highest achieved
        const achievedLevels = mastery.skillLevels.filter((l) => l.achieved)
        mastery.currentLevel = achievedLevels.length > 0
          ? Math.max(...achievedLevels.map((l) => l.order))
          : 0

        await get().updateYearlyGoal(goalId, { mastery })
      },

      // Project: Update milestone status
      updateMilestoneStatus: async (goalId, milestoneId, status) => {
        const goal = get().yearlyGoals.find((g) => g.id === goalId)
        if (!goal?.project) return

        const project = { ...goal.project }
        project.milestones = project.milestones.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                status,
                completedAt: status === "completed" ? new Date() : undefined,
              }
            : m
        )

        // Update next action to first pending milestone's first unchecked item
        const nextMilestone = project.milestones.find((m) => m.status === "pending")
        if (nextMilestone?.checklistItems) {
          const nextItem = nextMilestone.checklistItems.find((item) => !item.completed)
          project.nextAction = nextItem?.title
        }

        await get().updateYearlyGoal(goalId, { project })
      },

      // Outcome: Update current value
      updateOutcomeValue: async (goalId, currentValue) => {
        const goal = get().yearlyGoals.find((g) => g.id === goalId)
        if (!goal?.outcome) return

        const outcome = { ...goal.outcome, currentValue }

        // Update checkpoint if exists for today
        const today = new Date().toISOString().split("T")[0]
        const checkpointIndex = outcome.checkpoints.findIndex((c) => c.date === today)
        if (checkpointIndex >= 0) {
          outcome.checkpoints[checkpointIndex].actualValue = currentValue
        }

        await get().updateYearlyGoal(goalId, { outcome })
      },

      // Mastery: Add practice entry
      addPracticeEntry: async (goalId, entry) => {
        const goal = get().yearlyGoals.find((g) => g.id === goalId)
        if (!goal?.mastery) return

        const mastery = { ...goal.mastery }
        const practiceEntry = {
          id: generateId(),
          date: new Date().toISOString().split("T")[0],
          ...entry,
        }
        mastery.practiceLog = [...(mastery.practiceLog || []), practiceEntry]

        await get().updateYearlyGoal(goalId, { mastery })
      },
    }),
    {
      name: "goals-storage",
      partialize: (state) => ({
        yearlyGoals: state.yearlyGoals,
        monthlyGoals: state.monthlyGoals,
        weeklyGoals: state.weeklyGoals,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
