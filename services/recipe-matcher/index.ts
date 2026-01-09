import type { AirFryerRecipe, InventoryItem, RecipeMatch, RecipeSuggestionPreferences } from "@/lib/types"
import { matchRecipeRuleBased, rankMatches } from "./rule-based"
import { enhanceWithOllama, generateRecipeFromIngredients } from "./ollama-suggester"
import { checkOllamaConnection } from "@/services/ollama"

export interface MatcherConfig {
  enableOllama: boolean
  ollamaTimeout: number
  minMatchScore: number
  maxSuggestions: number
}

const DEFAULT_CONFIG: MatcherConfig = {
  enableOllama: true,
  ollamaTimeout: 10000,
  minMatchScore: 0.3,
  maxSuggestions: 10,
}

// Main matching function - orchestrates rule-based and Ollama
export async function matchRecipesToInventory(
  inventory: InventoryItem[],
  recipes: AirFryerRecipe[],
  preferences?: RecipeSuggestionPreferences,
  config?: Partial<MatcherConfig>
): Promise<RecipeMatch[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Step 1: Rule-based matching (always runs, fast)
  let matches = recipes.map((recipe) => matchRecipeRuleBased(recipe, inventory))

  // Step 2: Apply preference filters
  matches = applyPreferenceFilters(matches, preferences)

  // Step 3: Filter by minimum score and limit results
  matches = matches
    .filter((m) => m.matchScore >= cfg.minMatchScore)
    .slice(0, cfg.maxSuggestions)

  // Step 4: Rank matches
  matches = rankMatches(matches)

  return matches
}

// Async enhancement with Ollama (call separately, non-blocking)
export async function enhanceMatchesWithOllama(
  matches: RecipeMatch[],
  inventory: InventoryItem[],
  onEnhanced: (enhanced: RecipeMatch[]) => void,
  config?: Partial<MatcherConfig>
): Promise<void> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  if (!cfg.enableOllama) return

  const isConnected = await checkOllamaConnection()
  if (!isConnected) return

  try {
    const enhanced = await enhanceWithOllama(matches, inventory, cfg.ollamaTimeout)
    onEnhanced(enhanced)
  } catch (error) {
    console.warn("Ollama enhancement failed:", error)
    // Silent fail - rule-based results already shown
  }
}

// Generate a new recipe from available ingredients (Ollama required)
export async function suggestNewRecipe(
  inventory: InventoryItem[],
  preferences?: RecipeSuggestionPreferences
): Promise<AirFryerRecipe | null> {
  const isConnected = await checkOllamaConnection()
  if (!isConnected) {
    return null
  }

  try {
    return await generateRecipeFromIngredients(inventory, preferences)
  } catch (error) {
    console.warn("Recipe generation failed:", error)
    return null
  }
}

// Apply user preferences to filter matches
function applyPreferenceFilters(
  matches: RecipeMatch[],
  preferences?: RecipeSuggestionPreferences
): RecipeMatch[] {
  if (!preferences) return matches

  let filtered = [...matches]

  if (preferences.maxPrepTime !== undefined) {
    filtered = filtered.filter((m) => m.recipe.prepTime <= preferences.maxPrepTime!)
  }

  if (preferences.maxCookTime !== undefined) {
    filtered = filtered.filter((m) => m.recipe.cookTime <= preferences.maxCookTime!)
  }

  if (preferences.preferredDifficulty) {
    filtered = filtered.filter((m) => m.recipe.difficulty === preferences.preferredDifficulty)
  }

  if (preferences.excludeIngredients?.length) {
    const excluded = preferences.excludeIngredients.map((i) => i.toLowerCase())
    filtered = filtered.filter(
      (m) => !m.recipe.requiredIngredients.some((i) =>
        excluded.some((e) => i.item.toLowerCase().includes(e))
      )
    )
  }

  return filtered
}
