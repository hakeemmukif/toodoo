"use client"

import { useEffect, useState } from "react"
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

  const loadGoals = useGoalsStore((state) => state.loadGoals)
  const loadTasks = useTasksStore((state) => state.loadTasks)
  const loadRecurrenceTemplates = useTasksStore((state) => state.loadRecurrenceTemplates)
  const loadEntries = useJournalStore((state) => state.loadEntries)
  const loadSessions = useTrainingStore((state) => state.loadSessions)
  const loadMeals = useMealsStore((state) => state.loadMeals)
  const loadRecipes = useRecipesStore((state) => state.loadRecipes)
  const loadLists = useShoppingStore((state) => state.loadLists)
  const loadItems = useShoppingStore((state) => state.loadItems)
  const loadInboxItems = useInboxStore((state) => state.loadItems)
  const loadReviews = useReviewsStore((state) => state.loadReviews)
  const loadSnapshots = useFinancialStore((state) => state.loadSnapshots)

  useEffect(() => {
    async function loadAllData() {
      // Skip if already loaded - this is the key for instant navigation
      if (isDataLoaded) return

      try {
        // Initialize app first
        await initialize()

        // Load all data in parallel
        await Promise.all([
          loadGoals(),
          loadTasks(),
          loadRecurrenceTemplates(),
          loadEntries(),
          loadSessions(),
          loadMeals(),
          loadRecipes(),
          loadLists(),
          loadItems(),
          loadInboxItems(),
          loadReviews(),
          loadSnapshots(),
        ])

        setDataLoaded()
      } catch (err) {
        setError("Failed to load data")
        console.error("Data initialization error:", err)
      }
    }

    loadAllData()
  }, [
    isDataLoaded,
    setDataLoaded,
    initialize,
    loadGoals,
    loadTasks,
    loadRecurrenceTemplates,
    loadEntries,
    loadSessions,
    loadMeals,
    loadRecipes,
    loadLists,
    loadItems,
    loadInboxItems,
    loadReviews,
    loadSnapshots,
  ])

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

  const today = new Date().toISOString().split("T")[0]

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
