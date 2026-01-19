import type { IngredientSuggestion, AirFryerCategory } from "@/lib/types"
import { generateWithOllama, checkOllamaConnection } from "@/services/ollama"

/**
 * Query Ollama for cooking parameters of an unknown ingredient.
 * Returns null if Ollama is unavailable or can't determine parameters.
 *
 * This is a fallback for ingredients not in our database.
 */
export async function queryOllamaForIngredient(
  ingredient: string,
  isFrozen: boolean = false
): Promise<IngredientSuggestion | null> {
  // Check if Ollama is available first
  const isConnected = await checkOllamaConnection()
  if (!isConnected) {
    return null
  }

  const prompt = `You are an air fryer cooking expert. Given an ingredient, provide the optimal air fryer cooking settings.

Ingredient: ${isFrozen ? "frozen " : ""}${ingredient}

Respond in this exact JSON format only, no other text:
{
  "temperature": <number in Celsius, typically 150-220>,
  "timeMinutes": <number, cooking time in minutes>,
  "shakeHalfway": <boolean, whether to shake/flip midway>,
  "category": "<one of: protein, vegetable, frozen, bread, snack, other>",
  "notes": "<optional brief cooking tip>"
}

If you're not confident about this ingredient or it's not suitable for air frying, respond with: {"unknown": true}`

  try {
    const response = await generateWithOllama(prompt, {
      timeout: 10000, // 10 second timeout
    })

    if (!response) return null

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Check if Ollama couldn't determine parameters
    if (parsed.unknown) {
      return null
    }

    // Validate required fields
    if (
      typeof parsed.temperature !== "number" ||
      typeof parsed.timeMinutes !== "number" ||
      typeof parsed.shakeHalfway !== "boolean"
    ) {
      return null
    }

    // Validate reasonable ranges
    if (
      parsed.temperature < 100 || parsed.temperature > 250 ||
      parsed.timeMinutes < 1 || parsed.timeMinutes > 120
    ) {
      return null
    }

    // Map category with fallback
    const validCategories: AirFryerCategory[] = ["protein", "vegetable", "frozen", "bread", "snack", "other"]
    const category = validCategories.includes(parsed.category)
      ? (parsed.category as AirFryerCategory)
      : "other"

    // Capitalize ingredient name for display
    const displayName = ingredient
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")

    return {
      ingredient: isFrozen ? `Frozen ${displayName}` : displayName,
      temperature: Math.round(parsed.temperature),
      timeMinutes: Math.round(parsed.timeMinutes),
      shakeHalfway: parsed.shakeHalfway,
      category: isFrozen ? "frozen" : category,
      confidence: 0.7, // Lower confidence for LLM-generated suggestions
      source: "ollama",
      notes: parsed.notes || undefined
    }
  } catch (error) {
    console.error("Ollama ingredient query failed:", error)
    return null
  }
}
