/**
 * Frequency Parser
 *
 * Parses frequency patterns from goal titles to extract structured frequency data.
 * Examples:
 *   "Train 4x per week" → { target: 4, period: 'week', action: 'train' }
 *   "Cook 5 meals weekly" → { target: 5, period: 'week', action: 'cook' }
 *   "3 DJ sessions/month" → { target: 3, period: 'month', action: 'dj' }
 */

import type { LifeAspect, FrequencyGoal } from "@/lib/types"

export interface ParsedFrequency extends FrequencyGoal {
  confidence: number
}

// Action keywords by aspect for matching
const ACTION_KEYWORDS: Record<LifeAspect, string[]> = {
  fitness: ["train", "workout", "exercise", "gym", "run", "swim", "lift", "cardio", "muay thai", "spar"],
  nutrition: ["cook", "meal", "prep", "eat", "recipe", "breakfast", "lunch", "dinner"],
  career: ["work", "meeting", "review", "deploy", "ship", "standup", "sprint"],
  financial: ["save", "invest", "budget", "pay", "transfer", "review finances"],
  "side-projects": ["dj", "practice", "mix", "produce", "code", "build", "stream", "create"],
  chores: ["clean", "laundry", "vacuum", "wash", "organize", "declutter", "fix"],
}

// Flatten all action keywords for general matching
const ALL_ACTION_KEYWORDS = Object.values(ACTION_KEYWORDS).flat()

/**
 * Parse frequency pattern from a goal title
 *
 * Supported patterns:
 * - "4x per week", "4x a week", "4x/week", "4 times per week"
 * - "4 sessions weekly", "4 workouts a week"
 * - "weekly 4", "daily 2", "monthly 3"
 * - "twice a week", "three times per month"
 */
export function parseFrequencyFromTitle(title: string): ParsedFrequency | null {
  const normalized = title.toLowerCase().trim()

  // Pattern 1: "4x per week", "4x a week", "4x/week"
  const xPattern = /(\d+)x\s*(per|a|each|\/)\s*(day|week|month)/i
  let match = normalized.match(xPattern)
  if (match) {
    return {
      target: parseInt(match[1], 10),
      period: normalizePeriod(match[3]),
      action: extractActionKeyword(normalized),
      confidence: 0.95,
    }
  }

  // Pattern 2: "4 times per week", "4 sessions weekly", "4 workouts a month"
  const timesPattern = /(\d+)\s*(times?|sessions?|workouts?|meals?|practices?)\s*(per|a|each|\/|a)?\s*(day|week|month|daily|weekly|monthly)/i
  match = normalized.match(timesPattern)
  if (match) {
    return {
      target: parseInt(match[1], 10),
      period: normalizePeriod(match[4]),
      action: extractActionKeyword(normalized),
      confidence: 0.90,
    }
  }

  // Pattern 3: "weekly 4", "daily 2", "monthly 3"
  const prefixPattern = /(daily|weekly|monthly)\s*(\d+)/i
  match = normalized.match(prefixPattern)
  if (match) {
    return {
      target: parseInt(match[2], 10),
      period: normalizePeriod(match[1]),
      action: extractActionKeyword(normalized),
      confidence: 0.85,
    }
  }

  // Pattern 4: Word numbers "twice a week", "three times per month"
  const wordNumberPattern = /(once|twice|thrice|one|two|three|four|five|six|seven)\s*(times?)?\s*(per|a|each|\/)\s*(day|week|month)/i
  match = normalized.match(wordNumberPattern)
  if (match) {
    const numberMap: Record<string, number> = {
      once: 1,
      one: 1,
      twice: 2,
      two: 2,
      thrice: 3,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
    }
    return {
      target: numberMap[match[1].toLowerCase()] || 1,
      period: normalizePeriod(match[4]),
      action: extractActionKeyword(normalized),
      confidence: 0.85,
    }
  }

  // Pattern 5: Simple "every day", "every week" (implies 1x)
  const everyPattern = /every\s*(day|week|month)/i
  match = normalized.match(everyPattern)
  if (match) {
    return {
      target: 1,
      period: normalizePeriod(match[1]),
      action: extractActionKeyword(normalized),
      confidence: 0.70,
    }
  }

  // Pattern 6: Just "daily", "weekly", "monthly" without number (implies 1x)
  const singlePattern = /^(daily|weekly|monthly)\b/i
  match = normalized.match(singlePattern)
  if (match) {
    return {
      target: 1,
      period: normalizePeriod(match[1]),
      action: extractActionKeyword(normalized),
      confidence: 0.60,
    }
  }

  return null
}

/**
 * Normalize period strings to standard format
 */
function normalizePeriod(period: string): "day" | "week" | "month" {
  const p = period.toLowerCase()
  if (p === "daily" || p === "day") return "day"
  if (p === "weekly" || p === "week") return "week"
  if (p === "monthly" || p === "month") return "month"
  return "week" // Default to week
}

/**
 * Extract action keyword from title text
 * Looks for known action words that can be used for task matching
 */
export function extractActionKeyword(title: string, aspect?: LifeAspect): string | undefined {
  const normalized = title.toLowerCase()

  // If aspect is provided, prioritize its keywords
  if (aspect) {
    const aspectKeywords = ACTION_KEYWORDS[aspect]
    for (const keyword of aspectKeywords) {
      if (normalized.includes(keyword)) {
        return keyword
      }
    }
  }

  // Otherwise, search all keywords
  for (const keyword of ALL_ACTION_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return keyword
    }
  }

  return undefined
}

/**
 * Check if an activity matches an action keyword
 * Uses fuzzy matching for variations (e.g., "training" matches "train")
 */
export function matchesAction(activity: string, action: string): boolean {
  const normalizedActivity = activity.toLowerCase()
  const normalizedAction = action.toLowerCase()

  // Direct match
  if (normalizedActivity.includes(normalizedAction)) {
    return true
  }

  // Stem matching (simple version)
  // "training" -> "train", "cooking" -> "cook", etc.
  const activityStem = normalizedActivity
    .replace(/ing$/, "")
    .replace(/s$/, "")
    .replace(/ed$/, "")

  const actionStem = normalizedAction
    .replace(/ing$/, "")
    .replace(/s$/, "")
    .replace(/ed$/, "")

  if (activityStem.includes(actionStem) || actionStem.includes(activityStem)) {
    return true
  }

  // Common synonyms
  const synonyms: Record<string, string[]> = {
    train: ["workout", "exercise", "gym", "lift"],
    workout: ["train", "exercise", "gym", "lift"],
    cook: ["meal", "prep", "recipe"],
    dj: ["mix", "practice", "spin"],
    mix: ["dj", "practice"],
  }

  const actionSynonyms = synonyms[normalizedAction] || []
  for (const synonym of actionSynonyms) {
    if (normalizedActivity.includes(synonym)) {
      return true
    }
  }

  return false
}

/**
 * Get action keywords for a specific aspect
 */
export function getActionKeywordsForAspect(aspect: LifeAspect): string[] {
  return ACTION_KEYWORDS[aspect] || []
}
