import { create } from "zustand"
import { db, generateId } from "@/db"
import type { YearlyGoal, MonthlyGoal, WeeklyGoal, LifeAspect, GoalStatus } from "@/lib/types"

interface GoalsState {
  yearlyGoals: YearlyGoal[]
  monthlyGoals: MonthlyGoal[]
  weeklyGoals: WeeklyGoal[]
  isLoading: boolean
  error: string | null

  // Actions
  loadGoals: () => Promise<void>

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
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  yearlyGoals: [],
  monthlyGoals: [],
  weeklyGoals: [],
  isLoading: false,
  error: null,

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
}))
