import type { IngredientSuggestion, IngredientEntry } from "@/lib/types"
import { INGREDIENT_DATABASE } from "./ingredient-database"
import { fuzzyMatch, fuzzyMatchBest, normalizeInput } from "./fuzzy-matcher"
import { queryOllamaForIngredient } from "./ollama-fallback"

export interface RecognitionOptions {
  useOllama?: boolean           // Try Ollama for unknown ingredients
  maxResults?: number           // Max suggestions to return
  minConfidence?: number        // Minimum confidence threshold
  detectFrozen?: boolean        // Auto-detect "frozen X" patterns
}

const DEFAULT_OPTIONS: Required<RecognitionOptions> = {
  useOllama: true,
  maxResults: 5,
  minConfidence: 0.5,
  detectFrozen: true
}

/**
 * Convert an IngredientEntry to IngredientSuggestion
 */
function entryToSuggestion(
  entry: IngredientEntry,
  confidence: number,
  matchedName: string,
  source: IngredientSuggestion["source"] = "database",
  isFrozen: boolean = false
): IngredientSuggestion {
  // Apply frozen adjustments if applicable
  let temperature = entry.temperature
  let timeMinutes = entry.timeMinutes

  if (isFrozen && entry.frozen) {
    timeMinutes += entry.frozen.addMinutes
    if (entry.frozen.addTemp) {
      temperature += entry.frozen.addTemp
    }
  }

  // Capitalize first letter of each word for display
  const displayName = matchedName
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

  return {
    ingredient: isFrozen ? `Frozen ${displayName}` : displayName,
    temperature,
    timeMinutes,
    timeRange: entry.timeRange,
    shakeHalfway: entry.shakeHalfway,
    category: isFrozen ? "frozen" : entry.category,
    confidence,
    source,
    notes: entry.notes,
    matchedName
  }
}

/**
 * Detect if input mentions "frozen" and extract the ingredient
 */
function detectFrozenPattern(input: string): { isFrozen: boolean; cleanedInput: string } {
  const normalized = input.toLowerCase().trim()

  const frozenPatterns = [
    /^frozen\s+(.+)$/i,
    /^(.+)\s+\(frozen\)$/i,
    /^(.+)\s+frozen$/i
  ]

  for (const pattern of frozenPatterns) {
    const match = normalized.match(pattern)
    if (match) {
      return { isFrozen: true, cleanedInput: match[1].trim() }
    }
  }

  return { isFrozen: false, cleanedInput: normalized }
}

/**
 * Recognize ingredients from user input
 * Returns suggestions sorted by confidence
 */
export async function recognizeIngredients(
  input: string,
  options?: RecognitionOptions
): Promise<IngredientSuggestion[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!input || input.trim().length < 2) {
    return []
  }

  // Check for frozen pattern
  const { isFrozen, cleanedInput } = opts.detectFrozen
    ? detectFrozenPattern(input)
    : { isFrozen: false, cleanedInput: input }

  // Fuzzy match against database
  const matches = fuzzyMatch(cleanedInput, INGREDIENT_DATABASE, {
    maxResults: opts.maxResults,
    minConfidence: opts.minConfidence
  })

  // Convert to suggestions
  const suggestions = matches.map(match =>
    entryToSuggestion(
      match.entry,
      match.confidence,
      match.matchedName,
      "database",
      isFrozen
    )
  )

  // If no database matches and Ollama enabled, try LLM fallback
  if (suggestions.length === 0 && opts.useOllama) {
    try {
      const ollamaSuggestion = await queryOllamaForIngredient(cleanedInput, isFrozen)
      if (ollamaSuggestion) {
        return [ollamaSuggestion]
      }
    } catch {
      // Ollama unavailable - return empty
      console.log("Ollama unavailable for ingredient recognition")
    }
  }

  return suggestions
}

/**
 * Get a single best suggestion for an ingredient
 * Convenience wrapper for quick lookups
 */
export async function recognizeIngredient(
  input: string,
  options?: RecognitionOptions
): Promise<IngredientSuggestion | null> {
  const suggestions = await recognizeIngredients(input, {
    ...options,
    maxResults: 1
  })
  return suggestions[0] ?? null
}

/**
 * Synchronous database-only lookup (no Ollama)
 * Use when you need immediate results without async
 */
export function recognizeIngredientSync(
  input: string,
  options?: Omit<RecognitionOptions, "useOllama">
): IngredientSuggestion | null {
  const { isFrozen, cleanedInput } = detectFrozenPattern(input)

  const match = fuzzyMatchBest(cleanedInput, INGREDIENT_DATABASE)
  if (!match) return null

  return entryToSuggestion(
    match.entry,
    match.confidence,
    match.matchedName,
    "database",
    isFrozen
  )
}

/**
 * Synchronous multi-result lookup
 */
export function recognizeIngredientsSync(
  input: string,
  options?: Omit<RecognitionOptions, "useOllama">
): IngredientSuggestion[] {
  const opts = { ...DEFAULT_OPTIONS, ...options, useOllama: false }
  const { isFrozen, cleanedInput } = opts.detectFrozen
    ? detectFrozenPattern(input)
    : { isFrozen: false, cleanedInput: input }

  const matches = fuzzyMatch(cleanedInput, INGREDIENT_DATABASE, {
    maxResults: opts.maxResults,
    minConfidence: opts.minConfidence
  })

  return matches.map(match =>
    entryToSuggestion(
      match.entry,
      match.confidence,
      match.matchedName,
      "database",
      isFrozen
    )
  )
}

// Re-export utilities
export { normalizeInput } from "./fuzzy-matcher"
export { INGREDIENT_DATABASE, getAllIngredients, getIngredientsByCategory } from "./ingredient-database"
