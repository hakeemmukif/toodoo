import type { AirFryerRecipe, InventoryItem, RecipeMatch, RecipeSuggestionPreferences } from "@/lib/types"
import { generateWithOllama } from "@/services/ollama"
import { generateId } from "@/db"

// Enhance rule-based matches with Ollama suggestions
export async function enhanceWithOllama(
  matches: RecipeMatch[],
  inventory: InventoryItem[],
  timeout: number
): Promise<RecipeMatch[]> {
  const inventoryList = inventory
    .map((i) => `- ${i.name}: ${i.quantity} ${i.unit}`)
    .join("\n")

  const recipeSummaries = matches
    .slice(0, 5) // Only enhance top 5
    .map((m) => `- ${m.recipe.title} (${m.matchScore * 100}% match, missing: ${m.missingIngredients.filter((i) => !i.isOptional).map((i) => i.name).join(", ") || "none"})`)
    .join("\n")

  const prompt = `You are a helpful cooking assistant. Given the user's pantry and recipe matches, suggest substitutions for missing ingredients.

USER'S PANTRY:
${inventoryList}

RECIPE MATCHES:
${recipeSummaries}

For each recipe with missing ingredients, suggest substitutions from the pantry if possible.
Respond in JSON format:
{
  "suggestions": [
    {
      "recipeTitle": "Recipe Name",
      "substitutions": [
        { "missing": "ingredient name", "substitute": "pantry item", "ratio": "1:1 or ratio" }
      ]
    }
  ]
}

Only suggest realistic substitutions. If no good substitution exists, don't include it.`

  try {
    const response = await generateWithOllama(prompt, { timeout })
    const parsed = parseOllamaResponse(response) as {
      suggestions?: Array<{
        recipeTitle: string
        substitutions?: Array<{ missing: string; substitute: string; ratio: string }>
      }>
    }

    // Apply suggestions to matches
    return matches.map((match) => {
      const suggestion = parsed.suggestions?.find(
        (s) => s.recipeTitle.toLowerCase() === match.recipe.title.toLowerCase()
      )

      if (suggestion?.substitutions?.length) {
        // Mark as LLM-enhanced
        return {
          ...match,
          source: "llm" as const,
          // Could add substitution info to match if needed
        }
      }

      return match
    })
  } catch (error) {
    console.warn("Ollama enhancement failed:", error)
    return matches
  }
}

// Generate a completely new recipe from available ingredients
export async function generateRecipeFromIngredients(
  inventory: InventoryItem[],
  preferences?: RecipeSuggestionPreferences
): Promise<AirFryerRecipe | null> {
  const inventoryList = inventory
    .filter((i) => ["protein", "vegetable", "fruit"].includes(i.category))
    .map((i) => `- ${i.name}: ${i.quantity} ${i.unit}`)
    .join("\n")

  const prefsText = preferences ? `
Preferences:
- Max prep time: ${preferences.maxPrepTime || "any"} minutes
- Max cook time: ${preferences.maxCookTime || "any"} minutes
- Difficulty: ${preferences.preferredDifficulty || "any"}
- Avoid: ${preferences.excludeIngredients?.join(", ") || "none"}
` : ""

  const prompt = `You are a creative air fryer chef. Create a simple, delicious air fryer recipe using these available ingredients:

AVAILABLE INGREDIENTS:
${inventoryList}
${prefsText}

Create ONE air fryer recipe. Respond in this exact JSON format:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "difficulty": "easy" | "medium" | "hard",
  "prepTime": 10,
  "cookTime": 15,
  "servings": 2,
  "airFryerSettings": {
    "temperature": 180,
    "temperatureUnit": "C",
    "timeMinutes": 15,
    "shakeHalfway": true,
    "preheatRequired": false
  },
  "requiredIngredients": [
    { "item": "ingredient", "quantity": 200, "unit": "g" }
  ],
  "optionalIngredients": [],
  "steps": [
    { "order": 1, "instruction": "Step description", "durationMinutes": 5, "tip": "Optional tip" }
  ],
  "tags": ["Quick", "High-Protein"],
  "nutrition": { "calories": 300, "protein": 25, "carbs": 10, "fat": 15 }
}

Only use ingredients from the available list. Be practical and realistic.`

  try {
    const response = await generateWithOllama(prompt, { timeout: 30000 }) // 30s for generation
    const parsed = parseOllamaResponse(response)

    // Type the parsed response
    const recipe = parsed as {
      title?: string
      description?: string
      difficulty?: "easy" | "medium" | "hard"
      prepTime?: number
      cookTime?: number
      servings?: number
      airFryerSettings?: {
        temperature: number
        temperatureUnit: "C" | "F"
        timeMinutes: number
        shakeHalfway?: boolean
        preheatRequired?: boolean
      }
      requiredIngredients?: Array<{ item: string; quantity: number; unit: string }>
      optionalIngredients?: Array<{ item: string; quantity: number; unit: string }>
      steps?: Array<{ order: number; instruction: string; durationMinutes?: number; tip?: string }>
      tags?: string[]
      nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number }
      instructions?: string
    }

    if (!recipe.title || !recipe.requiredIngredients) {
      return null
    }

    // Build complete recipe object
    const airFryerRecipe: AirFryerRecipe = {
      id: generateId(),
      title: recipe.title,
      description: recipe.description || "",
      difficulty: recipe.difficulty || "easy",
      prepTime: recipe.prepTime || 10,
      cookTime: recipe.cookTime || 15,
      servings: recipe.servings || 2,
      airFryerSettings: recipe.airFryerSettings || {
        temperature: 180,
        temperatureUnit: "C",
        timeMinutes: 15,
        shakeHalfway: false,
        preheatRequired: false,
      },
      requiredIngredients: recipe.requiredIngredients.map((i) => ({
        item: i.item,
        quantity: i.quantity,
        unit: i.unit,
      })),
      optionalIngredients: recipe.optionalIngredients?.map((i) => ({
        item: i.item,
        quantity: i.quantity,
        unit: i.unit,
      })) || [],
      steps: recipe.steps?.map((s) => ({
        order: s.order,
        instruction: s.instruction,
        durationMinutes: s.durationMinutes,
        tip: s.tip,
      })) || [
        { order: 1, instruction: recipe.instructions || "Cook in air fryer", durationMinutes: recipe.cookTime || 15 }
      ],
      tags: recipe.tags || ["AI Generated"],
      nutrition: recipe.nutrition,
      ingredients: recipe.requiredIngredients.map((i) => ({
        item: i.item,
        quantity: i.quantity,
        unit: i.unit,
      })),
      instructions: recipe.steps?.map((s) => s.instruction).join("\n") || "",
      timesCooked: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return airFryerRecipe
  } catch (error) {
    console.warn("Recipe generation failed:", error)
    return null
  }
}

// Parse Ollama response (handles markdown code blocks)
function parseOllamaResponse(response: string): Record<string, unknown> {
  try {
    // Try direct JSON parse first
    return JSON.parse(response)
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim())
      } catch {
        // Fall through
      }
    }

    // Try finding JSON object in response
    const objectMatch = response.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch {
        // Fall through
      }
    }

    return {}
  }
}
