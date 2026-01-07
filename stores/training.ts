import { create } from "zustand"
import { db, generateId, formatDate } from "@/db"
import type { TrainingSession, TrainingType, YearlyGoal } from "@/lib/types"

interface GoalContribution {
  sessions: number
  totalMinutes: number
  avgIntensity: number
  recentSessions: TrainingSession[]
}

interface TrainingState {
  sessions: TrainingSession[]
  isLoading: boolean
  error: string | null

  // Actions
  loadSessions: () => Promise<void>
  addSession: (session: Omit<TrainingSession, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateSession: (id: string, updates: Partial<TrainingSession>) => Promise<void>
  deleteSession: (id: string) => Promise<void>

  // Helpers
  getSessionsForDate: (date: string) => TrainingSession[]
  getSessionsForWeek: (weekStart: Date) => TrainingSession[]
  getSessionsByType: (type: TrainingType) => TrainingSession[]
  calculateStreak: () => number
  getStats: () => {
    totalSessions: number
    totalMinutes: number
    avgIntensity: number
    thisWeekSessions: number
    thisWeekMinutes: number
  }

  // Goal integration
  getSessionsForGoal: (goalId: string) => TrainingSession[]
  calculateGoalContribution: (goalId: string) => GoalContribution
  getSuggestedGoalsForSession: (type: TrainingType) => Promise<YearlyGoal[]>
  linkSessionToGoal: (sessionId: string, goalId: string) => Promise<void>
  unlinkSessionFromGoal: (sessionId: string) => Promise<void>
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  loadSessions: async () => {
    set({ isLoading: true, error: null })
    try {
      const sessions = await db.trainingSessions.orderBy("date").reverse().toArray()
      set({ sessions, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load training sessions", isLoading: false })
    }
  },

  addSession: async (sessionData) => {
    const id = generateId()
    const session: TrainingSession = {
      ...sessionData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.trainingSessions.add(session)
    set((state) => ({ sessions: [session, ...state.sessions] }))
    return id
  },

  updateSession: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() }
    await db.trainingSessions.update(id, updatedData)
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updatedData } : s)),
    }))
  },

  deleteSession: async (id) => {
    await db.trainingSessions.delete(id)
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
    }))
  },

  // Helpers
  getSessionsForDate: (date) => {
    return get().sessions.filter((s) => s.date === date)
  },

  getSessionsForWeek: (weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const startStr = formatDate(weekStart)
    const endStr = formatDate(weekEnd)

    return get().sessions.filter((s) => s.date >= startStr && s.date <= endStr)
  },

  getSessionsByType: (type) => {
    return get().sessions.filter((s) => s.type === type)
  },

  calculateStreak: () => {
    const sessions = get().sessions
    if (sessions.length === 0) return 0

    // Sort by date descending
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Get unique dates
    const uniqueDates = [...new Set(sortedSessions.map((s) => s.date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    let streak = 0
    const today = new Date()
    let currentDate = new Date(today)

    // Check if there's a session today or yesterday
    const todayStr = formatDate(today)
    const yesterdayStr = formatDate(new Date(today.setDate(today.getDate() - 1)))

    if (!uniqueDates.includes(todayStr) && !uniqueDates.includes(yesterdayStr)) {
      return 0 // Streak broken
    }

    // Count consecutive days
    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr)
      const expectedDate = new Date(currentDate)
      expectedDate.setDate(currentDate.getDate() - streak)

      const diff = Math.abs(
        (date.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diff <= 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  },

  getStats: () => {
    const sessions = get().sessions
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())

    const thisWeekSessions = get().getSessionsForWeek(weekStart)

    return {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
      avgIntensity:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.intensity, 0) / sessions.length
          : 0,
      thisWeekSessions: thisWeekSessions.length,
      thisWeekMinutes: thisWeekSessions.reduce((sum, s) => sum + s.duration, 0),
    }
  },

  // Goal integration methods
  getSessionsForGoal: (goalId) => {
    return get().sessions.filter((s) => s.linkedGoalId === goalId)
  },

  calculateGoalContribution: (goalId) => {
    const sessions = get().getSessionsForGoal(goalId)
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
    const avgIntensity =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.intensity, 0) / sessions.length
        : 0

    // Get 5 most recent sessions
    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    return {
      sessions: sessions.length,
      totalMinutes,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      recentSessions,
    }
  },

  getSuggestedGoalsForSession: async (type) => {
    // Get active fitness or side-projects goals based on training type
    const relevantAspects = type === "dj-practice" ? ["side-projects"] : ["fitness"]

    const goals = await db.yearlyGoals
      .where("status")
      .equals("active")
      .toArray()

    return goals.filter((g) => relevantAspects.includes(g.aspect))
  },

  linkSessionToGoal: async (sessionId, goalId) => {
    await db.trainingSessions.update(sessionId, {
      linkedGoalId: goalId,
      updatedAt: new Date(),
    })
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, linkedGoalId: goalId, updatedAt: new Date() } : s
      ),
    }))
  },

  unlinkSessionFromGoal: async (sessionId) => {
    await db.trainingSessions.update(sessionId, {
      linkedGoalId: undefined,
      updatedAt: new Date(),
    })
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, linkedGoalId: undefined, updatedAt: new Date() } : s
      ),
    }))
  },
}))
