import { create } from "zustand"
import { db, generateId, formatDate } from "@/db"
import type { Meal, MealType } from "@/lib/types"

interface MealsState {
  meals: Meal[]
  isLoading: boolean
  error: string | null

  // Actions
  loadMeals: () => Promise<void>
  addMeal: (meal: Omit<Meal, "id" | "createdAt" | "updatedAt">) => Promise<string>
  updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>
  deleteMeal: (id: string) => Promise<void>

  // Helpers
  getMealsForDate: (date: string) => Meal[]
  getMealsByType: (type: MealType) => Meal[]
  getCookingStats: () => {
    totalMeals: number
    cookedMeals: number
    orderedMeals: number
    cookingRatio: number
    cookingStreak: number
  }
}

export const useMealsStore = create<MealsState>((set, get) => ({
  meals: [],
  isLoading: false,
  error: null,

  loadMeals: async () => {
    set({ isLoading: true, error: null })
    try {
      const meals = await db.meals.orderBy("date").reverse().toArray()
      set({ meals, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load meals", isLoading: false })
    }
  },

  addMeal: async (mealData) => {
    const id = generateId()
    const meal: Meal = {
      ...mealData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.meals.add(meal)
    set((state) => ({ meals: [meal, ...state.meals] }))
    return id
  },

  updateMeal: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() }
    await db.meals.update(id, updatedData)
    set((state) => ({
      meals: state.meals.map((m) => (m.id === id ? { ...m, ...updatedData } : m)),
    }))
  },

  deleteMeal: async (id) => {
    await db.meals.delete(id)
    set((state) => ({
      meals: state.meals.filter((m) => m.id !== id),
    }))
  },

  // Helpers
  getMealsForDate: (date) => {
    return get().meals.filter((m) => m.date === date)
  },

  getMealsByType: (type) => {
    return get().meals.filter((m) => m.type === type)
  },

  getCookingStats: () => {
    const meals = get().meals
    const cookedMeals = meals.filter((m) => m.cooked).length
    const orderedMeals = meals.filter((m) => !m.cooked).length

    // Calculate cooking streak
    const uniqueDates = [...new Set(meals.map((m) => m.date))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    let cookingStreak = 0
    const today = new Date()

    for (const dateStr of uniqueDates) {
      const dateMeals = meals.filter((m) => m.date === dateStr)
      const allCooked = dateMeals.every((m) => m.cooked)

      if (allCooked && dateMeals.length > 0) {
        cookingStreak++
      } else {
        break
      }
    }

    return {
      totalMeals: meals.length,
      cookedMeals,
      orderedMeals,
      cookingRatio: meals.length > 0 ? Math.round((cookedMeals / meals.length) * 100) : 0,
      cookingStreak,
    }
  },
}))
