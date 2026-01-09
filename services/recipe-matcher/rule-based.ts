import type { AirFryerRecipe, InventoryItem, RecipeMatch, RecipeIngredient } from "@/lib/types"
import { normalizeIngredientName, findMatchingInventoryItem } from "@/services/inventory"

// Match a single recipe against inventory using rule-based approach
export function matchRecipeRuleBased(
  recipe: AirFryerRecipe,
  inventory: InventoryItem[]
): RecipeMatch {
  const matchedIngredients: RecipeMatch["matchedIngredients"] = []
  const missingIngredients: RecipeMatch["missingIngredients"] = []

  // Check required ingredients
  for (const required of recipe.requiredIngredients) {
    const inventoryItem = findMatchingInventoryItem(required.item, inventory)

    if (inventoryItem) {
      // Found in inventory - check if enough
      const hasEnough = checkQuantitySufficient(inventoryItem, required)
      matchedIngredients.push({
        name: required.item,
        hasEnough,
        available: inventoryItem.quantity,
        required: required.quantity,
        unit: required.unit,
      })
    } else {
      // Not in inventory
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
    const inventoryItem = findMatchingInventoryItem(optional.item, inventory)

    if (inventoryItem) {
      const hasEnough = checkQuantitySufficient(inventoryItem, optional)
      matchedIngredients.push({
        name: optional.item,
        hasEnough,
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

  // Calculate match score (based on required ingredients only)
  const requiredCount = recipe.requiredIngredients.length
  const matchedRequiredCount = recipe.requiredIngredients.filter((req) =>
    matchedIngredients.some((m) =>
      normalizeIngredientName(m.name) === normalizeIngredientName(req.item)
    )
  ).length

  const matchScore = requiredCount > 0 ? matchedRequiredCount / requiredCount : 0

  // Check if can make now
  const missingRequired = missingIngredients.filter((m) => !m.isOptional)
  const hasAllRequired = missingRequired.length === 0
  const hasEnoughOfAll = matchedIngredients
    .filter((m) =>
      recipe.requiredIngredients.some((r) =>
        normalizeIngredientName(r.item) === normalizeIngredientName(m.name)
      )
    )
    .every((m) => m.hasEnough)

  const canMakeNow = hasAllRequired && hasEnoughOfAll

  return {
    recipe,
    matchScore,
    matchedIngredients,
    missingIngredients,
    canMakeNow,
    source: "rule",
  }
}

// Check if inventory has sufficient quantity (with basic unit conversion)
function checkQuantitySufficient(
  inventory: InventoryItem,
  required: RecipeIngredient
): boolean {
  // Same units - simple comparison
  if (inventory.unit === required.unit) {
    return inventory.quantity >= required.quantity
  }

  // Basic unit conversions
  const converted = convertUnits(inventory.quantity, inventory.unit, required.unit)
  if (converted !== null) {
    return converted >= required.quantity
  }

  // Can't convert - assume it's okay if we have the item
  return true
}

// Basic unit conversion
function convertUnits(
  value: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const conversions: Record<string, Record<string, number>> = {
    // Weight
    kg: { g: 1000 },
    g: { kg: 0.001 },
    // Volume
    l: { ml: 1000 },
    ml: { l: 0.001 },
    // Common cooking
    cup: { ml: 240, tbsp: 16, tsp: 48 },
    tbsp: { ml: 15, tsp: 3, cup: 0.0625 },
    tsp: { ml: 5, tbsp: 0.333, cup: 0.0208 },
  }

  const fromConversions = conversions[fromUnit]
  if (fromConversions && fromConversions[toUnit]) {
    return value * fromConversions[toUnit]
  }

  return null
}

// Rank matches by relevance
export function rankMatches(matches: RecipeMatch[]): RecipeMatch[] {
  return [...matches].sort((a, b) => {
    // First: can make now
    if (a.canMakeNow !== b.canMakeNow) {
      return a.canMakeNow ? -1 : 1
    }

    // Second: higher match score
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore
    }

    // Third: fewer missing ingredients
    const aMissing = a.missingIngredients.filter((m) => !m.isOptional).length
    const bMissing = b.missingIngredients.filter((m) => !m.isOptional).length
    if (aMissing !== bMissing) {
      return aMissing - bMissing
    }

    // Fourth: quicker recipes
    const aTime = a.recipe.prepTime + a.recipe.cookTime
    const bTime = b.recipe.prepTime + b.recipe.cookTime
    return aTime - bTime
  })
}
