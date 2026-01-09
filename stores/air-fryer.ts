import { create } from "zustand"
import { db, generateId } from "@/db"
import type { AirFryerRecipe, AirFryerDevice, RecipeMatch, InventoryItem, RecipeSuggestionPreferences } from "@/lib/types"
import { useInventoryStore } from "./inventory"

// Standard recipe capacity for portion calculations
const STANDARD_CAPACITY_LITERS = 3.5

interface AirFryerState {
  recipes: AirFryerRecipe[]
  suggestions: RecipeMatch[]
  device: AirFryerDevice | null
  isLoading: boolean
  isSuggesting: boolean
  error: string | null

  // Actions
  loadRecipes: () => Promise<void>
  addRecipe: (recipe: Omit<AirFryerRecipe, "id" | "createdAt" | "updatedAt" | "timesCooked">) => Promise<string>
  updateRecipe: (id: string, updates: Partial<AirFryerRecipe>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
  markCooked: (recipeId: string, portionsUsed?: number) => Promise<void>
  rateRecipe: (id: string, rating: number) => Promise<void>

  // Device settings
  loadDevice: () => Promise<void>
  saveDevice: (device: Omit<AirFryerDevice, "id" | "createdAt" | "updatedAt">) => Promise<void>

  // Suggestion actions
  getSuggestions: (preferences?: RecipeSuggestionPreferences) => Promise<RecipeMatch[]>
  clearSuggestions: () => void

  // Helpers
  getRecipeById: (id: string) => AirFryerRecipe | undefined
  getByDifficulty: (difficulty: "easy" | "medium" | "hard") => AirFryerRecipe[]
  getQuickRecipes: (maxMinutes: number) => AirFryerRecipe[]
  searchRecipes: (query: string) => AirFryerRecipe[]
  getAdjustedServings: (recipeServings: number) => number
  convertTemperature: (tempC: number) => number
}

// Normalize ingredient name for matching (same as inventory store)
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/s$/, "")
    .replace(/es$/, "")
    .replace(/ies$/, "y")
}

// Rule-based recipe matching
function matchRecipeToInventory(
  recipe: AirFryerRecipe,
  inventory: InventoryItem[]
): RecipeMatch {
  const matchedIngredients: RecipeMatch["matchedIngredients"] = []
  const missingIngredients: RecipeMatch["missingIngredients"] = []

  // Check required ingredients
  for (const required of recipe.requiredIngredients) {
    const normalized = normalizeIngredientName(required.item)
    const inventoryItem = inventory.find(
      (i) => i.normalizedName === normalized || i.normalizedName.includes(normalized)
    )

    if (inventoryItem) {
      matchedIngredients.push({
        name: required.item,
        hasEnough: inventoryItem.quantity >= required.quantity,
        available: inventoryItem.quantity,
        required: required.quantity,
        unit: required.unit,
      })
    } else {
      missingIngredients.push({
        name: required.item,
        required: required.quantity,
        unit: required.unit,
        isOptional: false,
      })
    }
  }

  // Check optional ingredients
  for (const optional of recipe.optionalIngredients || []) {
    const normalized = normalizeIngredientName(optional.item)
    const inventoryItem = inventory.find(
      (i) => i.normalizedName === normalized || i.normalizedName.includes(normalized)
    )

    if (inventoryItem) {
      matchedIngredients.push({
        name: optional.item,
        hasEnough: inventoryItem.quantity >= optional.quantity,
        available: inventoryItem.quantity,
        required: optional.quantity,
        unit: optional.unit,
      })
    } else {
      missingIngredients.push({
        name: optional.item,
        required: optional.quantity,
        unit: optional.unit,
        isOptional: true,
      })
    }
  }

  // Calculate match score (only based on required ingredients)
  const requiredCount = recipe.requiredIngredients.length
  const matchedRequiredCount = matchedIngredients.filter(
    (m) => !recipe.optionalIngredients?.some((o) => o.item === m.name)
  ).length

  const matchScore = requiredCount > 0 ? matchedRequiredCount / requiredCount : 0

  // Check if user can make it now (all required with enough quantity)
  const canMakeNow = missingIngredients.filter((m) => !m.isOptional).length === 0 &&
    matchedIngredients
      .filter((m) => !recipe.optionalIngredients?.some((o) => o.item === m.name))
      .every((m) => m.hasEnough)

  return {
    recipe,
    matchScore,
    matchedIngredients,
    missingIngredients,
    canMakeNow,
    source: "rule",
  }
}

export const useAirFryerStore = create<AirFryerState>((set, get) => ({
  recipes: [],
  suggestions: [],
  device: null,
  isLoading: false,
  isSuggesting: false,
  error: null,

  loadRecipes: async () => {
    set({ isLoading: true, error: null })
    try {
      const recipes = await db.airFryerRecipes.toArray()
      set({ recipes, isLoading: false })
    } catch (error) {
      set({ error: "Failed to load air fryer recipes", isLoading: false })
    }
  },

  addRecipe: async (recipeData) => {
    const id = generateId()
    const recipe: AirFryerRecipe = {
      ...recipeData,
      id,
      timesCooked: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await db.airFryerRecipes.add(recipe)
    set((state) => ({ recipes: [...state.recipes, recipe] }))
    return id
  },

  updateRecipe: async (id, updates) => {
    const updatedData = { ...updates, updatedAt: new Date() }
    await db.airFryerRecipes.update(id, updatedData)
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...updatedData } : r)),
    }))
  },

  deleteRecipe: async (id) => {
    await db.airFryerRecipes.delete(id)
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    }))
  },

  markCooked: async (recipeId, portionsUsed) => {
    const recipe = get().recipes.find((r) => r.id === recipeId)
    if (!recipe) return

    // Update recipe cook count
    await get().updateRecipe(recipeId, {
      lastCooked: new Date(),
      timesCooked: recipe.timesCooked + 1,
    })

    // If portionsUsed provided, deduct from inventory
    if (portionsUsed && portionsUsed > 0) {
      const inventoryStore = useInventoryStore.getState()
      const ratio = portionsUsed / recipe.servings

      const usages: { itemId: string; amount: number }[] = []

      for (const ingredient of recipe.requiredIngredients) {
        const inventoryItem = inventoryStore.findByName(ingredient.item)
        if (inventoryItem) {
          usages.push({
            itemId: inventoryItem.id,
            amount: ingredient.quantity * ratio,
          })
        }
      }

      if (usages.length > 0) {
        await inventoryStore.useIngredients(usages)
      }
    }
  },

  rateRecipe: async (id, rating) => {
    await get().updateRecipe(id, { rating })
  },

  loadDevice: async () => {
    try {
      // Get the first (and usually only) device
      const devices = await db.airFryerDevices.toArray()
      if (devices.length > 0) {
        set({ device: devices[0] })
      }
    } catch (error) {
      console.warn("Failed to load air fryer device settings:", error)
    }
  },

  saveDevice: async (deviceData) => {
    const existingDevice = get().device
    const now = new Date()

    if (existingDevice) {
      // Update existing device
      const updated: AirFryerDevice = {
        ...existingDevice,
        ...deviceData,
        updatedAt: now,
      }
      await db.airFryerDevices.update(existingDevice.id, updated)
      set({ device: updated })
    } else {
      // Create new device
      const newDevice: AirFryerDevice = {
        id: generateId(),
        ...deviceData,
        createdAt: now,
        updatedAt: now,
      }
      await db.airFryerDevices.add(newDevice)
      set({ device: newDevice })
    }
  },

  getSuggestions: async (preferences) => {
    set({ isSuggesting: true })
    try {
      const { recipes } = get()
      const inventory = useInventoryStore.getState().items

      // Match all recipes against inventory
      let matches = recipes.map((recipe) => matchRecipeToInventory(recipe, inventory))

      // Apply preference filters
      if (preferences?.maxPrepTime) {
        matches = matches.filter((m) => m.recipe.prepTime <= preferences.maxPrepTime!)
      }
      if (preferences?.maxCookTime) {
        matches = matches.filter((m) => m.recipe.cookTime <= preferences.maxCookTime!)
      }
      if (preferences?.preferredDifficulty) {
        matches = matches.filter((m) => m.recipe.difficulty === preferences.preferredDifficulty)
      }
      if (preferences?.excludeIngredients?.length) {
        const excluded = preferences.excludeIngredients.map(normalizeIngredientName)
        matches = matches.filter(
          (m) => !m.recipe.requiredIngredients.some((i) =>
            excluded.includes(normalizeIngredientName(i.item))
          )
        )
      }

      // Sort: canMakeNow first, then by match score
      matches.sort((a, b) => {
        if (a.canMakeNow !== b.canMakeNow) {
          return a.canMakeNow ? -1 : 1
        }
        return b.matchScore - a.matchScore
      })

      set({ suggestions: matches, isSuggesting: false })
      return matches
    } catch (error) {
      set({ error: "Failed to get suggestions", isSuggesting: false })
      return []
    }
  },

  clearSuggestions: () => {
    set({ suggestions: [] })
  },

  // Helpers
  getRecipeById: (id) => {
    return get().recipes.find((r) => r.id === id)
  },

  getByDifficulty: (difficulty) => {
    return get().recipes.filter((r) => r.difficulty === difficulty)
  },

  getQuickRecipes: (maxMinutes) => {
    return get().recipes.filter((r) => r.prepTime + r.cookTime <= maxMinutes)
  },

  searchRecipes: (query) => {
    const lowerQuery = query.toLowerCase()
    return get().recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.requiredIngredients.some((i) => i.item.toLowerCase().includes(lowerQuery)) ||
        r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    )
  },

  // Calculate adjusted servings based on user's device capacity
  getAdjustedServings: (recipeServings) => {
    const device = get().device
    if (!device) return recipeServings

    const adjustmentFactor = device.capacityLiters / STANDARD_CAPACITY_LITERS
    return Math.round(recipeServings * adjustmentFactor)
  },

  // Convert temperature to user's preferred unit
  convertTemperature: (tempC) => {
    const device = get().device
    if (!device || device.temperatureUnit === "C") return tempC
    // Convert Celsius to Fahrenheit
    return Math.round((tempC * 9) / 5 + 32)
  },
}))
