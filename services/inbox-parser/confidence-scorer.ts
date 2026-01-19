/**
 * Confidence Scorer
 *
 * Calculates overall confidence from parsed slots and determines
 * which fields should be auto-filled vs require user input.
 */

import type { ParsedResult, ConfidenceLevel, Task, SlotType, LifeAspect, TimePreference } from "@/lib/types"
import { extractDate } from "./entity-extractors/date-extractor"
import { extractTime } from "./entity-extractors/time-extractor"

// Weights for overall confidence calculation
const SLOT_WEIGHTS = {
  what: 0.25,        // Activity is most important
  intent: 0.20,      // Classification
  date: 0.20,        // When
  time: 0.10,        // Specific time (often optional)
  where: 0.08,       // Location (often optional)
  duration: 0.08,    // Duration estimate
  priority: 0.05,    // Priority (p1-p4)
  who: 0.04,         // People (rarely extracted)
}

// Thresholds for confidence levels
const CONFIDENCE_THRESHOLDS = {
  high: 0.80,
  medium: 0.50,
}

// Thresholds for auto-fill decisions
const AUTO_FILL_THRESHOLD = 0.80
const SUGGEST_THRESHOLD = 0.50

export type FieldAction = "auto" | "suggest" | "manual"

/**
 * Calculate overall confidence from parsed result
 */
export function calculateOverallConfidence(parsed: ParsedResult): number {
  let totalWeight = 0
  let weightedSum = 0

  // What (activity)
  if (parsed.what) {
    weightedSum += parsed.what.confidence * SLOT_WEIGHTS.what
    totalWeight += SLOT_WEIGHTS.what
  }

  // Intent (aspect)
  if (parsed.intent) {
    weightedSum += parsed.intent.confidence * SLOT_WEIGHTS.intent
    totalWeight += SLOT_WEIGHTS.intent
  }

  // Date
  if (parsed.when?.date) {
    weightedSum += parsed.when.date.confidence * SLOT_WEIGHTS.date
    totalWeight += SLOT_WEIGHTS.date
  }

  // Time
  if (parsed.when?.time) {
    weightedSum += parsed.when.time.confidence * SLOT_WEIGHTS.time
    totalWeight += SLOT_WEIGHTS.time
  }

  // Location
  if (parsed.where) {
    weightedSum += parsed.where.confidence * SLOT_WEIGHTS.where
    totalWeight += SLOT_WEIGHTS.where
  }

  // Duration
  if (parsed.duration) {
    weightedSum += parsed.duration.confidence * SLOT_WEIGHTS.duration
    totalWeight += SLOT_WEIGHTS.duration
  }

  // Priority
  if (parsed.priority) {
    weightedSum += parsed.priority.confidence * SLOT_WEIGHTS.priority
    totalWeight += SLOT_WEIGHTS.priority
  }

  // Who (people)
  if (parsed.who) {
    weightedSum += parsed.who.confidence * SLOT_WEIGHTS.who
    totalWeight += SLOT_WEIGHTS.who
  }

  // Normalize by total weight
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Get confidence level from score
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return "high"
  if (confidence >= CONFIDENCE_THRESHOLDS.medium) return "medium"
  return "low"
}

/**
 * Determine which fields should be auto-filled
 */
export function getFieldActions(parsed: ParsedResult): Record<string, FieldAction> {
  return {
    title: getAction(parsed.what?.confidence),
    aspect: getAction(parsed.intent?.confidence),
    date: getAction(parsed.when?.date?.confidence),
    time: getAction(parsed.when?.time?.confidence),
    timePreference: getAction(parsed.when?.timePreference?.confidence),
    location: getAction(parsed.where?.confidence),
    duration: getAction(parsed.duration?.confidence),
  }
}

function getAction(confidence: number | undefined): FieldAction {
  if (!confidence || confidence === 0) return "manual"
  if (confidence >= AUTO_FILL_THRESHOLD) return "auto"
  if (confidence >= SUGGEST_THRESHOLD) return "suggest"
  return "manual"
}

/**
 * Check if the parsed result is actionable (can create task)
 */
export function isActionable(parsed: ParsedResult): boolean {
  // Minimum requirements: activity and aspect
  const hasActivity = parsed.what && parsed.what.confidence >= SUGGEST_THRESHOLD
  const hasAspect = parsed.intent && parsed.intent.confidence >= SUGGEST_THRESHOLD

  return Boolean(hasActivity && hasAspect)
}

/**
 * Get missing required fields
 */
export function getMissingFields(parsed: ParsedResult): string[] {
  const missing: string[] = []

  if (!parsed.what || parsed.what.confidence < SUGGEST_THRESHOLD) {
    missing.push("activity")
  }

  if (!parsed.intent || parsed.intent.confidence < SUGGEST_THRESHOLD) {
    missing.push("category")
  }

  if (!parsed.when?.date || parsed.when.date.confidence < SUGGEST_THRESHOLD) {
    missing.push("date")
  }

  return missing
}

/**
 * Generate suggestions for improving the input
 */
export function getSuggestions(parsed: ParsedResult): string[] {
  const suggestions: string[] = []

  if (!parsed.what) {
    suggestions.push("What specific action will you take?")
  }

  if (!parsed.intent) {
    suggestions.push("What area of life does this relate to?")
  }

  if (!parsed.when?.date) {
    suggestions.push("When will you do this?")
  }

  if (parsed.when?.date && !parsed.when?.time) {
    suggestions.push("Adding a specific time increases follow-through.")
  }

  if (!parsed.duration) {
    suggestions.push("How long will this take?")
  }

  return suggestions
}

/**
 * Build a suggested task from parsed result
 */
export function buildSuggestedTask(
  parsed: ParsedResult,
  defaultDate: string
): Partial<Task> {
  const task: Partial<Task> = {
    status: "pending",
    deferCount: 0,
    isSubtask: false,
  }

  // Title from activity
  if (parsed.what && parsed.what.confidence >= SUGGEST_THRESHOLD) {
    task.title = parsed.what.value
  }

  // Aspect from intent
  if (parsed.intent && parsed.intent.confidence >= SUGGEST_THRESHOLD) {
    task.aspect = parsed.intent.value
  }

  // Date
  if (parsed.when?.date && parsed.when.date.confidence >= SUGGEST_THRESHOLD) {
    task.scheduledDate = parsed.when.date.value
  } else {
    task.scheduledDate = defaultDate // Default to today
  }

  // Time - use same threshold as other fields, not stricter
  if (parsed.when?.time && parsed.when.time.confidence >= SUGGEST_THRESHOLD) {
    task.hardScheduledTime = parsed.when.time.value
  }

  // Time preference
  if (parsed.when?.timePreference && parsed.when.timePreference.confidence >= SUGGEST_THRESHOLD) {
    task.timePreference = parsed.when.timePreference.value
  } else {
    task.timePreference = "anytime"
  }

  // Duration
  if (parsed.duration && parsed.duration.confidence >= SUGGEST_THRESHOLD) {
    task.durationEstimate = parsed.duration.value
  }

  // Location
  if (parsed.where && parsed.where.confidence >= SUGGEST_THRESHOLD) {
    task.location = parsed.where.value
  }

  // WHO - who the task is with (defaults to "solo")
  if (parsed.who) {
    task.who = parsed.who.value
    task.whoType = parsed.who.whoType
  } else {
    task.who = "solo"
    task.whoType = "solo"
  }

  // Priority (p1-p4)
  if (parsed.priority && parsed.priority.confidence >= SUGGEST_THRESHOLD) {
    task.priority = parsed.priority.value
  }

  return task
}

/**
 * Check if quick confirm should be shown
 */
export function shouldShowQuickConfirm(parsed: ParsedResult): boolean {
  // Show quick confirm if:
  // 1. Overall confidence is high
  // 2. Has the minimum required fields (activity, aspect)
  // 3. Date is specified or defaults to today

  const hasHighConfidence = parsed.overallConfidence >= CONFIDENCE_THRESHOLDS.high
  const hasActivity = parsed.what && parsed.what.confidence >= AUTO_FILL_THRESHOLD
  const hasAspect = parsed.intent && parsed.intent.confidence >= AUTO_FILL_THRESHOLD

  return hasHighConfidence && Boolean(hasActivity) && Boolean(hasAspect)
}

/**
 * Merge user clarifications into parsed result
 *
 * Takes user-provided answers for missing slots and incorporates them
 * into the parsed result with high confidence (user-provided = 1.0)
 */
export function mergeClarifications(
  parsed: ParsedResult,
  clarifications: Partial<Record<SlotType, string>>
): ParsedResult {
  // Clone the parsed result to avoid mutations
  const merged: ParsedResult = JSON.parse(JSON.stringify(parsed))

  // Process each clarification
  for (const [slot, value] of Object.entries(clarifications)) {
    if (!value || value.trim() === '') continue

    const trimmedValue = value.trim()

    switch (slot as SlotType) {
      case 'what':
        merged.what = {
          value: trimmedValue,
          rawMatch: trimmedValue,
          confidence: 1.0, // User-provided = full confidence
          source: 'rule', // Mark as user-provided but keep type compatible
        }
        break

      case 'when':
        // Parse the time/date string user provided
        const dateResult = extractDate(trimmedValue)
        const timeResult = extractTime(trimmedValue)

        if (!merged.when) {
          merged.when = { isRelative: false }
        }

        if (dateResult) {
          merged.when.date = {
            value: dateResult.date,
            rawMatch: dateResult.matchedText,
            confidence: 1.0,
            source: 'rule',
          }
          merged.when.isRelative = dateResult.isRelative
        }

        if (timeResult?.time) {
          merged.when.time = {
            value: timeResult.time,
            rawMatch: timeResult.matchedText,
            confidence: 1.0,
            source: 'rule',
          }
        }

        if (timeResult?.timePreference && !merged.when.time) {
          merged.when.timePreference = {
            value: timeResult.timePreference,
            rawMatch: timeResult.matchedText,
            confidence: 1.0,
            source: 'rule',
          }
        }
        break

      case 'where':
        merged.where = {
          value: trimmedValue,
          rawMatch: trimmedValue,
          confidence: 1.0,
          source: 'rule',
        }
        break

      case 'who':
        // Classify who type based on value
        const lowerWho = trimmedValue.toLowerCase()
        let whoType: "solo" | "one-on-one" | "group" | "team" = "one-on-one"
        if (lowerWho === "solo" || lowerWho === "alone") {
          whoType = "solo"
        } else if (["team", "squad", "group", "class", "family", "friends"].some(g => lowerWho.includes(g))) {
          whoType = lowerWho.includes("team") || lowerWho.includes("squad") ? "team" : "group"
        }

        merged.who = {
          value: trimmedValue,
          rawMatch: trimmedValue,
          confidence: 1.0,
          source: 'rule',
          whoType,
        }
        break

      case 'why':
        // WHY is the life aspect
        const validAspects: LifeAspect[] = [
          'fitness', 'nutrition', 'career', 'financial', 'side-projects', 'chores'
        ]
        if (validAspects.includes(trimmedValue as LifeAspect)) {
          merged.intent = {
            value: trimmedValue as LifeAspect,
            rawMatch: trimmedValue,
            confidence: 1.0,
            source: 'rule',
          }
        }
        break

      case 'duration':
        // Parse duration from string (e.g., "30 minutes", "1 hour", "90")
        const durationMinutes = parseDurationString(trimmedValue)
        if (durationMinutes > 0) {
          merged.duration = {
            value: durationMinutes,
            rawMatch: trimmedValue,
            confidence: 1.0,
            source: 'rule',
          }
        }
        break
    }
  }

  // Recalculate overall confidence
  merged.overallConfidence = calculateOverallConfidence(merged)
  merged.confidenceLevel = getConfidenceLevel(merged.overallConfidence)

  // Rebuild suggested task
  const today = new Date().toISOString().split('T')[0]
  merged.suggestedTask = buildSuggestedTask(merged, today)

  return merged
}

/**
 * Parse duration string to minutes
 */
function parseDurationString(input: string): number {
  const normalized = input.toLowerCase().trim()

  // Check for just a number (assume minutes)
  if (/^\d+$/.test(normalized)) {
    return parseInt(normalized, 10)
  }

  // Pattern: "X hours Y minutes" or "Xhr Ymin"
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/)
  const minuteMatch = normalized.match(/(\d+)\s*(?:minutes?|mins?|m(?!in))/)

  let totalMinutes = 0

  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60
  }

  if (minuteMatch) {
    totalMinutes += parseInt(minuteMatch[1], 10)
  }

  // If no matches but has a decimal, treat as hours
  if (totalMinutes === 0) {
    const decimalMatch = normalized.match(/(\d+(?:\.\d+)?)/)
    if (decimalMatch) {
      const num = parseFloat(decimalMatch[1])
      // If less than 10, assume hours; otherwise minutes
      if (num < 10 && normalized.includes('.')) {
        totalMinutes = num * 60
      } else {
        totalMinutes = num
      }
    }
  }

  return Math.round(totalMinutes)
}
