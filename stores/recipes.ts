import { create } from "zustand"
import { db, generateId } from "@/db"
import type { Recipe, RecipeIngredient } from "@/lib/types"

interface RecipesState {
  recipes: Recipe[]
  isLoading: boolean
  error: string | null

  // Actions
  loadRecipes: () => Promise<void>
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt" | "timesCooked">) => Promise<string>
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  markAsCooked: (id: string) => Promise<void>
  rateRecipe: (id: string, rating: number) => Promise<void>

  // Helpers
  getRecipeById: (id: string) => Recipe | undefined
  searchRecipes: (query: string) => Recipe[]
  getRecipesByTag: (tag: string) => Recipe[]
  getTopRatedRecipes: (limit?: number) => Recipe[]
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [],
  isLoading: false,
  error: null,

  loadRecipes: async () => {
    set({ isLoading: true, error: null })
    try {
      const recipes = await db.recipes.toArray()
      set({ recipes, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load recipes", isLoading: false })
    }
  },

  addRecipe: async (recipeData) => {
    const id = generateId()
    const recipe: Recipe = {
      ...recipeData,
      id,
      timesCooked: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.recipes.add(recipe)
    set((state) => ({ recipes: [...state.recipes, recipe] }))
    return id
  },

  updateRecipe: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() }
    await db.recipes.update(id, updatedData)
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...updatedData } : r)),
    }))
  },

  deleteRecipe: async (id) => {
    await db.recipes.delete(id)
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }))
  },

  markAsCooked: async (id) => {
    const recipe = get().recipes.find((r) => r.id === id)
    if (!recipe) return

    await get().updateRecipe(id, {
      lastCooked: new Date(),
      timesCooked: recipe.timesCooked + 1,
    })
  },

  rateRecipe: async (id, rating) => {
    await get().updateRecipe(id, { rating })
  },

  // Helpers
  getRecipeById: (id) => {
    return get().recipes.find((r) => r.id === id)
  },

  searchRecipes: (query) => {
    const lowerQuery = query.toLowerCase()
    return get().recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.ingredients.some((i) => i.item.toLowerCase().includes(lowerQuery)) ||
        r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    )
  },

  getRecipesByTag: (tag) => {
    return get().recipes.filter((r) => r.tags.includes(tag))
  },

  getTopRatedRecipes: (limit = 5) => {
    return [...get().recipes]
      .filter((r) => r.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit)
  },
}))
