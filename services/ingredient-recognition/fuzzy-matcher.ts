import type { IngredientEntry } from "@/lib/types"

export interface FuzzyMatchResult {
  entry: IngredientEntry
  confidence: number      // 0-1 match confidence
  matchedName: string     // Which alias matched
  matchType: "exact" | "partial" | "word-overlap" | "typo"
}

/**
 * Normalize input for matching:
 * - lowercase
 * - trim whitespace
 * - remove common articles
 * - basic singularization
 */
export function normalizeInput(input: string): string {
  let normalized = input.toLowerCase().trim()

  // Remove common articles and prefixes
  const articlesToRemove = ["a ", "an ", "the ", "some ", "my "]
  for (const article of articlesToRemove) {
    if (normalized.startsWith(article)) {
      normalized = normalized.slice(article.length)
    }
  }

  // Basic singularization (remove trailing 's' for common cases)
  // But preserve words that end in 'ss' like 'bass' or 'Brussels'
  if (normalized.endsWith("ies")) {
    // "fries" stays as "fries", "berries" -> "berry"
    // Only convert if not a known ingredient ending in 'ies'
    const keepAsIs = ["fries", "berries", "cookies"]
    if (!keepAsIs.includes(normalized)) {
      normalized = normalized.slice(0, -3) + "y"
    }
  } else if (normalized.endsWith("es") && !normalized.endsWith("oes")) {
    // "tomatoes" -> "tomato", but "dishes" -> "dish"
    const keepAsIs = ["potatoes", "tomatoes"]
    if (!keepAsIs.includes(normalized)) {
      normalized = normalized.slice(0, -2)
    }
  } else if (normalized.endsWith("s") && !normalized.endsWith("ss")) {
    // "wings" -> "wing", but "bass" stays "bass"
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for typo detection
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Calculate word overlap between input and target
 * Returns ratio of matching words
 */
function wordOverlapScore(input: string, target: string): number {
  const inputWords = input.split(/\s+/).filter(w => w.length > 2)
  const targetWords = target.split(/\s+/).filter(w => w.length > 2)

  if (inputWords.length === 0 || targetWords.length === 0) return 0

  let matches = 0
  for (const inputWord of inputWords) {
    for (const targetWord of targetWords) {
      if (inputWord === targetWord || targetWord.includes(inputWord) || inputWord.includes(targetWord)) {
        matches++
        break
      }
    }
  }

  // Score based on how many target words were matched
  return matches / targetWords.length
}

/**
 * Fuzzy match input against ingredient database
 * Returns all matches sorted by confidence (highest first)
 */
export function fuzzyMatch(
  input: string,
  database: IngredientEntry[],
  options?: { maxResults?: number; minConfidence?: number }
): FuzzyMatchResult[] {
  const { maxResults = 5, minConfidence = 0.5 } = options ?? {}

  const normalized = normalizeInput(input)
  if (!normalized || normalized.length < 2) return []

  const results: FuzzyMatchResult[] = []

  for (const entry of database) {
    let bestMatch: { name: string; confidence: number; type: FuzzyMatchResult["matchType"] } | null = null

    for (const name of entry.names) {
      const normalizedName = normalizeInput(name)

      // 1. Exact match (confidence: 1.0)
      if (normalized === normalizedName) {
        bestMatch = { name, confidence: 1.0, type: "exact" }
        break // Can't do better than exact
      }

      // 2. Input contains full ingredient name (confidence: 0.95)
      // e.g., "crispy chicken breast" contains "chicken breast"
      if (normalized.includes(normalizedName) && normalizedName.length >= 4) {
        const conf = 0.95
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { name, confidence: conf, type: "partial" }
        }
        continue
      }

      // 3. Ingredient name contains input (confidence: 0.85-0.9)
      // e.g., "chicken" matches "chicken breast"
      if (normalizedName.includes(normalized) && normalized.length >= 3) {
        // Longer matches get higher confidence
        const lengthRatio = normalized.length / normalizedName.length
        const conf = 0.85 + (lengthRatio * 0.1)
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { name, confidence: Math.min(conf, 0.92), type: "partial" }
        }
        continue
      }

      // 4. Word overlap match (confidence: 0.7-0.85)
      const overlapScore = wordOverlapScore(normalized, normalizedName)
      if (overlapScore >= 0.5) {
        const conf = 0.7 + (overlapScore * 0.15)
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { name, confidence: conf, type: "word-overlap" }
        }
        continue
      }

      // 5. Typo detection with Levenshtein distance (confidence: 0.6-0.8)
      // Only for shorter inputs to avoid false matches
      if (normalized.length >= 3 && normalized.length <= 15) {
        const distance = levenshteinDistance(normalized, normalizedName)
        const maxAllowedDistance = Math.floor(normalizedName.length / 3)

        if (distance <= maxAllowedDistance && distance > 0) {
          // Lower distance = higher confidence
          const conf = 0.8 - (distance * 0.1)
          if (!bestMatch || conf > bestMatch.confidence) {
            bestMatch = { name, confidence: Math.max(conf, 0.6), type: "typo" }
          }
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= minConfidence) {
      results.push({
        entry,
        confidence: bestMatch.confidence,
        matchedName: bestMatch.name,
        matchType: bestMatch.type
      })
    }
  }

  // Sort by confidence (highest first), then by name length (prefer shorter/more specific)
  results.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) < 0.05) {
      return a.matchedName.length - b.matchedName.length
    }
    return b.confidence - a.confidence
  })

  return results.slice(0, maxResults)
}

/**
 * Get a single best match (convenience wrapper)
 */
export function fuzzyMatchBest(
  input: string,
  database: IngredientEntry[]
): FuzzyMatchResult | null {
  const results = fuzzyMatch(input, database, { maxResults: 1, minConfidence: 0.6 })
  return results[0] ?? null
}
