"use client"

import { useEffect, useState, useRef } from "react"
import { useGoalsStore } from "@/stores/goals"
import { useTasksStore } from "@/stores/tasks"
import { useJournalStore } from "@/stores/journal"
import { useTrainingStore } from "@/stores/training"
import { useMealsStore } from "@/stores/meals"
import { useRecipesStore } from "@/stores/recipes"
import { useShoppingStore } from "@/stores/shopping"
import { useAppStore } from "@/stores/app"
import { useInboxStore } from "@/stores/inbox"
import { useReviewsStore } from "@/stores/reviews"
import { useFinancialStore } from "@/stores/financial"
import { useInventoryStore } from "@/stores/inventory"
import { useAirFryerStore } from "@/stores/air-fryer"

/**
 * Hook to initialize all stores and load data
 * Uses global Zustand state for persistence across navigations
 */
export function useInitializeData() {
  const [error, setError] = useState<string | null>(null)

  // Use global state from Zustand - persists across navigations
  const isDataLoaded = useAppStore((state) => state.isDataLoaded)
  const setDataLoaded = useAppStore((state) => state.setDataLoaded)
  const initialize = useAppStore((state) => state.initialize)

  // Store loading functions in refs to avoid dependency array issues
  // Zustand actions are stable, but refs make this explicit and lint-friendly
  const loadersRef = useRef({
    loadGoals: useGoalsStore.getState().loadGoals,
    loadTasks: useTasksStore.getState().loadTasks,
    loadRecurrenceTemplates: useTasksStore.getState().loadRecurrenceTemplates,
    loadEntries: useJournalStore.getState().loadEntries,
    loadSessions: useTrainingStore.getState().loadSessions,
    loadMeals: useMealsStore.getState().loadMeals,
    loadRecipes: useRecipesStore.getState().loadRecipes,
    loadLists: useShoppingStore.getState().loadLists,
    loadItems: useShoppingStore.getState().loadItems,
    loadInboxItems: useInboxStore.getState().loadItems,
    loadReviews: useReviewsStore.getState().loadReviews,
    loadSnapshots: useFinancialStore.getState().loadSnapshots,
    loadInventory: useInventoryStore.getState().loadItems,
    loadAirFryerRecipes: useAirFryerStore.getState().loadRecipes,
  })

  useEffect(() => {
    async function loadAllData() {
      // Skip if already loaded - this is the key for instant navigation
      if (isDataLoaded) return

      const loaders = loadersRef.current

      try {
        // Initialize app first
        await initialize()

        // Load all data in parallel
        await Promise.all([
          loaders.loadGoals(),
          loaders.loadTasks(),
          loaders.loadRecurrenceTemplates(),
          loaders.loadEntries(),
          loaders.loadSessions(),
          loaders.loadMeals(),
          loaders.loadRecipes(),
          loaders.loadLists(),
          loaders.loadItems(),
          loaders.loadInboxItems(),
          loaders.loadReviews(),
          loaders.loadSnapshots(),
          loaders.loadInventory(),
          loaders.loadAirFryerRecipes(),
        ])

        setDataLoaded()
      } catch (err) {
        setError("Failed to load data")
        console.error("Data initialization error:", err)
      }
    }

    loadAllData()
  }, [isDataLoaded, setDataLoaded, initialize])

  return { isDataLoaded, isLoading: !isDataLoaded && !error, error }
}

/**
 * Hook to get dashboard data
 */
export function useDashboardData() {
  const tasks = useTasksStore((state) => state.tasks)
  const yearlyGoals = useGoalsStore((state) => state.yearlyGoals)
  const trainingSessions = useTrainingStore((state) => state.sessions)
  const meals = useMealsStore((state) => state.meals)
  const journalEntries = useJournalStore((state) => state.entries)

  // Use local timezone for "today" to match how formatDate stores dates
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  // Today's tasks
  const todayTasks = tasks.filter(
    (task) => task.scheduledDate === today && task.status === "pending"
  )

  // Recent journal
  const recentJournal = journalEntries[0] || null

  // Calculate streaks
  const calculateStreak = (dates: string[]): number => {
    if (dates.length === 0) return 0
    const uniqueDates = [...new Set(dates)].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    let streak = 0
    const todayDate = new Date()

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(todayDate)
      expectedDate.setDate(todayDate.getDate() - i)
      const expectedStr = expectedDate.toISOString().split("T")[0]

      if (uniqueDates.includes(expectedStr)) {
        streak++
      } else if (i === 0) {
        // Allow for yesterday to count if not today
        expectedDate.setDate(todayDate.getDate() - 1)
        const yesterdayStr = expectedDate.toISOString().split("T")[0]
        if (uniqueDates.includes(yesterdayStr)) {
          streak++
        } else {
          break
        }
      } else {
        break
      }
    }

    return streak
  }

  const trainingStreak = calculateStreak(trainingSessions.map((s) => s.date))

  const cookedMeals = meals.filter((m) => m.cooked)
  const cookingDates = [...new Set(cookedMeals.map((m) => m.date))]
  const cookingStreak = calculateStreak(cookingDates)

  const journalDates = journalEntries.map((e) =>
    new Date(e.timestamp).toISOString().split("T")[0]
  )
  const journalStreak = calculateStreak(journalDates)

  return {
    todayTasks,
    yearlyGoals,
    recentJournal,
    stats: {
      trainingStreak,
      cookingStreak,
      journalStreak,
    },
  }
}
