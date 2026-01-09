import type { IngredientCategory, InventoryItem } from "@/lib/types"

// Common ingredient category mappings
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  protein: [
    "chicken", "beef", "pork", "lamb", "fish", "salmon", "tuna", "shrimp", "prawn",
    "tofu", "tempeh", "egg", "duck", "turkey", "sausage", "bacon", "ham"
  ],
  vegetable: [
    "potato", "carrot", "broccoli", "spinach", "kale", "lettuce", "tomato", "onion",
    "garlic", "pepper", "capsicum", "zucchini", "cucumber", "celery", "mushroom",
    "cauliflower", "cabbage", "corn", "pea", "bean", "asparagus", "eggplant"
  ],
  fruit: [
    "apple", "banana", "orange", "lemon", "lime", "berry", "strawberry", "blueberry",
    "mango", "pineapple", "grape", "watermelon", "avocado", "papaya", "durian"
  ],
  dairy: [
    "milk", "cheese", "butter", "cream", "yogurt", "curd", "paneer", "ghee"
  ],
  grain: [
    "rice", "pasta", "noodle", "bread", "flour", "oat", "quinoa", "couscous",
    "tortilla", "wrap", "cereal", "barley"
  ],
  spice: [
    "salt", "pepper", "cumin", "turmeric", "paprika", "chili", "oregano", "basil",
    "thyme", "rosemary", "cinnamon", "ginger", "coriander", "curry", "garlic powder"
  ],
  sauce: [
    "soy sauce", "oyster sauce", "fish sauce", "ketchup", "mayo", "mustard",
    "hot sauce", "sriracha", "teriyaki", "bbq sauce", "vinegar", "olive oil"
  ],
  oil: [
    "oil", "olive oil", "vegetable oil", "coconut oil", "sesame oil", "sunflower oil"
  ],
  other: []
}

// Normalize ingredient name for matching
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/s$/, "") // Remove trailing 's' (potatoes -> potato)
    .replace(/es$/, "") // tomatoes -> tomato
    .replace(/ies$/, "y") // berries -> berry
}

// Auto-suggest category based on ingredient name
export function suggestCategory(name: string): IngredientCategory {
  const normalized = normalizeIngredientName(name)

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))) {
      return category as IngredientCategory
    }
  }

  return "other"
}

// Get items expiring within X days
export function getExpiringItems(items: InventoryItem[], withinDays: number): InventoryItem[] {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + withinDays)
  const cutoffStr = cutoff.toISOString().split("T")[0]

  return items
    .filter((item) => item.expiresAt && item.expiresAt <= cutoffStr)
    .sort((a, b) => (a.expiresAt || "").localeCompare(b.expiresAt || ""))
}

// Check if two ingredient names are likely the same
export function ingredientsMatch(a: string, b: string): boolean {
  const normA = normalizeIngredientName(a)
  const normB = normalizeIngredientName(b)

  // Exact match
  if (normA === normB) return true

  // One contains the other
  if (normA.includes(normB) || normB.includes(normA)) return true

  // Common aliases
  const aliases: Record<string, string[]> = {
    "capsicum": ["bell pepper", "pepper"],
    "coriander": ["cilantro"],
    "prawn": ["shrimp"],
    "eggplant": ["aubergine"],
    "zucchini": ["courgette"],
  }

  for (const [key, values] of Object.entries(aliases)) {
    const allNames = [key, ...values]
    if (allNames.includes(normA) && allNames.includes(normB)) return true
  }

  return false
}

// Find matching inventory item for a recipe ingredient
export function findMatchingInventoryItem(
  ingredientName: string,
  inventory: InventoryItem[]
): InventoryItem | undefined {
  const normalized = normalizeIngredientName(ingredientName)

  // Try exact match first
  const exact = inventory.find((item) => item.normalizedName === normalized)
  if (exact) return exact

  // Try partial/fuzzy match
  return inventory.find((item) =>
    item.normalizedName.includes(normalized) ||
    normalized.includes(item.normalizedName) ||
    ingredientsMatch(ingredientName, item.name)
  )
}

// Format quantity with unit for display
export function formatQuantity(quantity: number, unit: string): string {
  // Round to reasonable precision
  const rounded = quantity % 1 === 0 ? quantity : Number(quantity.toFixed(1))

  // Handle plural units
  const pluralUnits: Record<string, string> = {
    piece: "pieces",
    slice: "slices",
    clove: "cloves",
    bunch: "bunches",
    whole: "whole",
  }

  if (rounded !== 1 && pluralUnits[unit]) {
    return `${rounded} ${pluralUnits[unit]}`
  }

  return `${rounded} ${unit}`
}
