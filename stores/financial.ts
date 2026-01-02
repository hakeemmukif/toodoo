import { create } from "zustand"
import { db, generateId, getMonthString } from "@/db"
import type { FinancialSnapshot } from "@/lib/types"

interface FinancialState {
  snapshots: FinancialSnapshot[]
  isLoading: boolean
  error: string | null

  // Actions
  loadSnapshots: () => Promise<void>
  addSnapshot: (snapshot: Omit<FinancialSnapshot, "id" | "createdAt">) => Promise<string>
  updateSnapshot: (id: string, updates: Partial<FinancialSnapshot>) => Promise<void>
  deleteSnapshot: (id: string) => Promise<void>

  // Helpers
  getSnapshotForMonth: (month: string) => FinancialSnapshot | undefined
  getCurrentMonthSnapshot: () => FinancialSnapshot | undefined
  getSnapshotsForGoal: (goalId: string) => FinancialSnapshot[]
  getLatestSnapshot: () => FinancialSnapshot | undefined
  calculateTrajectory: (goalId: string) => {
    onTrackCount: number
    offTrackCount: number
    projectedAmount?: number
  }
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  snapshots: [],
  isLoading: false,
  error: null,

  loadSnapshots: async () => {
    set({ isLoading: true, error: null })
    try {
      const snapshots = await db.financialSnapshots.toArray()
      // Sort by date descending (newest first)
      snapshots.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      set({ snapshots, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load financial snapshots", isLoading: false })
    }
  },

  addSnapshot: async (snapshotData) => {
    const id = generateId()
    const snapshot: FinancialSnapshot = {
      ...snapshotData,
      id,
      createdAt: new Date(),
    }
    await db.financialSnapshots.add(snapshot)
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] }))
    return id
  },

  updateSnapshot: async (id, updates) => {
    await db.financialSnapshots.update(id, updates)
    set((state) => ({
      snapshots: state.snapshots.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }))
  },

  deleteSnapshot: async (id) => {
    await db.financialSnapshots.delete(id)
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
    }))
  },

  getSnapshotForMonth: (month) => {
    // Month format: "2025-01"
    return get().snapshots.find((s) => s.date.startsWith(month))
  },

  getCurrentMonthSnapshot: () => {
    const currentMonth = getMonthString(new Date())
    return get().getSnapshotForMonth(currentMonth)
  },

  getSnapshotsForGoal: (goalId) => {
    return get().snapshots.filter((s) => s.linkedGoalId === goalId)
  },

  getLatestSnapshot: () => {
    return get().snapshots[0]
  },

  calculateTrajectory: (goalId) => {
    const goalSnapshots = get().getSnapshotsForGoal(goalId)

    const onTrackCount = goalSnapshots.filter((s) => s.onTrack).length
    const offTrackCount = goalSnapshots.filter((s) => !s.onTrack).length

    // Calculate projected amount based on average monthly savings
    let projectedAmount: number | undefined
    if (goalSnapshots.length >= 2) {
      const sortedSnapshots = [...goalSnapshots].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      const savingsAmounts = sortedSnapshots
        .map((s) => s.actualSaved)
        .filter((amount): amount is number => amount !== undefined)

      if (savingsAmounts.length >= 2) {
        const averageMonthlySavings =
          savingsAmounts.reduce((sum, a) => sum + a, 0) / savingsAmounts.length

        // Calculate months remaining in year
        const now = new Date()
        const monthsRemaining = 12 - now.getMonth()

        // Get current savings balance
        const latestBalance = sortedSnapshots
          .reverse()
          .find((s) => s.savingsBalance !== undefined)?.savingsBalance

        if (latestBalance !== undefined) {
          projectedAmount = latestBalance + averageMonthlySavings * monthsRemaining
        }
      }
    }

    return {
      onTrackCount,
      offTrackCount,
      projectedAmount,
    }
  },
}))
