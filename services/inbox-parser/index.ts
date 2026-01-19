/**
 * Inbox Parser - Main Orchestrator
 *
 * Parses natural language inbox captures into structured task data.
 * Uses rule-based extraction with optional Ollama LLM enhancement.
 *
 * Example: "training today at 7pm bunker kota damansara"
 * Output: { aspect: "fitness", date: "2026-01-07", time: "19:00", location: "The Bunker, Kota Damansara" }
 */

import type {
  ParsedResult,
  ParsedSlot,
  ParsedDateTime,
  ConfidenceLevel,
  LifeAspect,
  TimePreference,
  Task,
  TaskPriority,
} from "@/lib/types"
import { extractDate } from "./entity-extractors/date-extractor"
import { extractTime, extractDuration, inferTimePreferenceFromText } from "./entity-extractors/time-extractor"
import { extractWho } from "./entity-extractors/who-extractor"
import { extractPriority, removePriorityFromText } from "./entity-extractors/priority-extractor"
import { extractLocation, expandMalaysianAbbreviations, formatMalaysianDate, getMalaysianDate } from "./malaysian-context"
import { classifyIntent, inferActivityDescription } from "./intent-classifier"
import {
  calculateOverallConfidence,
  getConfidenceLevel,
  buildSuggestedTask,
  getSuggestions,
  getMissingFields,
} from "./confidence-scorer"
import { matchToGoals } from "./goal-matcher"
import { parseWithOllama, mergeExtractions } from "./ollama-parser"
import { checkOllamaConnection } from "@/services/ollama"
import { generateBreakdown } from "./breakdown-generator"

// Parser configuration
export interface ParserConfig {
  enableOllama: boolean
  ollamaTimeout: number // ms
  minConfidenceForAutoFill: number
  debounceMs: number
}

const DEFAULT_CONFIG: ParserConfig = {
  enableOllama: true,
  ollamaTimeout: 10000,
  minConfidenceForAutoFill: 0.80,
  debounceMs: 300,
}

// Current parser version for cache invalidation
export const PARSER_VERSION = 1

// Callback type for async Ollama enhancement
export type EnhancementCallback = (enhanced: ParsedResult) => void

/**
 * Main parsing function
 */
export async function parseInboxItem(
  content: string,
  config: Partial<ParserConfig> = {}
): Promise<ParsedResult> {
  const startTime = performance.now()
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // 1. Normalize input (expand Malaysian abbreviations)
  const normalizedContent = expandMalaysianAbbreviations(content)
  const tokens = tokenize(normalizedContent)

  // 2. Run all extractors in parallel
  const [dateResult, timeResult, locationResult, intentResult, durationResult, whoResult, priorityResult] = await Promise.all([
    Promise.resolve(extractDate(normalizedContent)),
    Promise.resolve(extractTime(normalizedContent)),
    Promise.resolve(extractLocation(normalizedContent)),
    Promise.resolve(classifyIntent(normalizedContent)),
    Promise.resolve(extractDuration(normalizedContent)),
    Promise.resolve(extractWho(normalizedContent)),
    Promise.resolve(extractPriority(normalizedContent)),
  ])

  // 3. Build parsed slots
  const what = buildWhatSlot(content, intentResult, priorityResult)
  const when = buildWhenSlot(dateResult, timeResult, normalizedContent)
  const where = buildWhereSlot(locationResult)
  const duration = buildDurationSlot(durationResult, intentResult?.aspect)
  const intent = buildIntentSlot(intentResult)
  const who = buildWhoSlot(whoResult)
  const priority = buildPrioritySlot(priorityResult)

  // 4. Build initial result
  const result: ParsedResult = {
    what,
    when,
    where,
    who, // Extracted WHO or default "solo"
    duration,
    priority, // Todoist-style priority (p1-p4)
    intent,
    goalMatch: null,
    alternativeGoals: [],
    overallConfidence: 0,
    confidenceLevel: "low" as ConfidenceLevel,
    parsingMethod: "rule",
    processingTimeMs: 0,
    suggestedTask: {},
    rawExtractions: {
      tokens,
      matchedPatterns: collectMatchedPatterns(dateResult, timeResult, locationResult, intentResult, priorityResult),
    },
  }

  // 5. Calculate overall confidence
  result.overallConfidence = calculateOverallConfidence(result)
  result.confidenceLevel = getConfidenceLevel(result.overallConfidence)

  // 6. Build suggested task
  const defaultDate = formatMalaysianDate(getMalaysianDate())
  result.suggestedTask = buildSuggestedTask(result, defaultDate)

  // 7. Match to goals (async database query)
  const goalMatchResult = await matchToGoals({
    aspect: intent?.value ?? null,
    scheduledDate: when?.date?.value ?? null,
    activity: what?.value ?? null,
    location: where?.value ?? null,
  })
  result.goalMatch = goalMatchResult.bestMatch
  result.alternativeGoals = goalMatchResult.alternatives

  // Update suggested task with weeklyGoalId if matched
  if (goalMatchResult.bestMatch) {
    result.suggestedTask.weeklyGoalId = goalMatchResult.bestMatch.weeklyGoalId
  }

  // 8. Finalize timing
  result.processingTimeMs = performance.now() - startTime

  return result
}

/**
 * Enhance parsing with Ollama LLM (async, non-blocking)
 *
 * Call this after parseInboxItem() returns to enhance results with LLM.
 * The callback is called with the enhanced result when complete.
 * Silently fails if Ollama is unavailable or times out.
 */
export async function enhanceWithOllama(
  content: string,
  ruleResult: ParsedResult,
  onEnhanced: EnhancementCallback,
  config: Partial<ParserConfig> = {}
): Promise<void> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Check connection first (fast check)
  const isConnected = await checkOllamaConnection()
  if (!isConnected) {
    return // Silent exit - rule-based result already showing
  }

  try {
    // Normalize content for LLM (same as rule-based)
    const normalizedContent = expandMalaysianAbbreviations(content)

    // Call Ollama with timeout
    const ollamaResult = await parseWithOllama(normalizedContent, ruleResult, {
      timeout: cfg.ollamaTimeout,
    })

    if (!ollamaResult) {
      return // LLM returned nothing useful
    }

    // Merge with rule-based result (LLM wins if higher confidence)
    const enhanced = mergeExtractions(ruleResult, ollamaResult)

    // Recalculate confidence with merged data
    enhanced.overallConfidence = calculateOverallConfidence(enhanced)
    enhanced.confidenceLevel = getConfidenceLevel(enhanced.overallConfidence)

    // Rebuild suggested task with enhanced data
    const defaultDate = formatMalaysianDate(getMalaysianDate())
    enhanced.suggestedTask = buildSuggestedTask(enhanced, defaultDate)

    // Re-match goals with potentially better aspect classification
    const goalMatchResult = await matchToGoals({
      aspect: enhanced.intent?.value ?? null,
      scheduledDate: enhanced.when?.date?.value ?? null,
      activity: enhanced.what?.value ?? null,
      location: enhanced.where?.value ?? null,
    })
    enhanced.goalMatch = goalMatchResult.bestMatch
    enhanced.alternativeGoals = goalMatchResult.alternatives

    // Update suggested task with weeklyGoalId if matched
    if (goalMatchResult.bestMatch) {
      enhanced.suggestedTask.weeklyGoalId = goalMatchResult.bestMatch.weeklyGoalId
    }

    // Regenerate breakdown if aspect was enhanced
    if (enhanced.intent?.value && enhanced.confidenceLevel !== "low") {
      enhanced.suggestedBreakdown = generateBreakdown(enhanced.intent.value, {
        time: enhanced.when?.time?.value,
        location: enhanced.where?.value,
        timePreference: enhanced.when?.timePreference?.value,
        totalDuration: enhanced.duration?.value,
      })
    }

    // Notify caller with enhanced result
    onEnhanced(enhanced)
  } catch (error) {
    // Silent failure - rule-based result is already showing
    console.warn("Ollama enhancement failed:", error)
  }
}

/**
 * Tokenize text for debugging/analysis
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(token => token.length > 0)
}

/**
 * Build the "what" (activity) slot
 * Cleans priority markers (p1-p4) from the title
 */
function buildWhatSlot(
  originalText: string,
  intentResult: ReturnType<typeof classifyIntent>,
  priorityResult: ReturnType<typeof extractPriority>
): ParsedSlot | null {
  // Clean priority markers from the activity description
  const cleanedText = priorityResult ? removePriorityFromText(originalText) : originalText
  const activity = inferActivityDescription(cleanedText, intentResult)

  if (activity.length < 2) return null

  return {
    value: activity,
    rawMatch: cleanedText,
    confidence: intentResult ? Math.min(intentResult.confidence + 0.1, 0.95) : 0.60,
    source: "rule",
  }
}

/**
 * Build the "when" (date/time) slot
 */
function buildWhenSlot(
  dateResult: ReturnType<typeof extractDate>,
  timeResult: ReturnType<typeof extractTime>,
  text: string
): ParsedDateTime | null {
  if (!dateResult && !timeResult) {
    // Try to infer time preference even without explicit date/time
    const inferredPreference = inferTimePreferenceFromText(text)
    if (inferredPreference) {
      return {
        date: undefined,
        time: undefined,
        timePreference: {
          value: inferredPreference,
          rawMatch: "",
          confidence: 0.60,
          source: "rule",
        },
        isRelative: false,
      }
    }
    return null
  }

  return {
    date: dateResult ? {
      value: dateResult.date,
      rawMatch: dateResult.matchedText,
      confidence: dateResult.confidence,
      source: "rule",
    } : undefined,
    time: timeResult ? {
      value: timeResult.time,
      rawMatch: timeResult.matchedText,
      confidence: timeResult.confidence,
      source: "rule",
    } : undefined,
    timePreference: timeResult ? {
      value: timeResult.timePreference,
      rawMatch: timeResult.matchedText,
      confidence: timeResult.confidence,
      source: "rule",
    } : undefined,
    isRelative: dateResult?.isRelative ?? false,
  }
}

/**
 * Build the "where" (location) slot
 */
function buildWhereSlot(
  locationResult: ReturnType<typeof extractLocation>
): ParsedSlot | null {
  if (!locationResult) return null

  return {
    value: locationResult.location,
    rawMatch: locationResult.rawMatch,
    confidence: locationResult.confidence,
    source: "rule",
  }
}

/**
 * Build the duration slot with aspect-based defaults
 */
function buildDurationSlot(
  durationResult: ReturnType<typeof extractDuration>,
  aspect?: LifeAspect
): ParsedSlot<number> | null {
  // Use explicit duration if found
  if (durationResult) {
    return {
      value: durationResult.minutes,
      rawMatch: durationResult.matchedText,
      confidence: durationResult.confidence,
      source: "rule",
    }
  }

  // Otherwise, use aspect-based defaults with lower confidence
  if (aspect) {
    const aspectDurations: Record<LifeAspect, number> = {
      fitness: 90,        // Training sessions typically 1.5 hours
      nutrition: 60,      // Meal prep
      career: 60,         // Work blocks
      financial: 30,      // Financial tasks
      "side-projects": 90, // Creative work
      chores: 45,         // Household tasks
    }

    return {
      value: aspectDurations[aspect],
      rawMatch: "",
      confidence: 0.50, // Lower confidence for inferred duration
      source: "rule",
    }
  }

  return null
}

/**
 * Build the intent (aspect) slot
 */
function buildIntentSlot(
  intentResult: ReturnType<typeof classifyIntent>
): ParsedSlot<LifeAspect> | null {
  if (!intentResult) return null

  return {
    value: intentResult.aspect,
    rawMatch: intentResult.matchedKeywords.join(", "),
    confidence: intentResult.confidence,
    source: "rule",
  }
}

/**
 * Build the WHO slot with whoType metadata
 */
function buildWhoSlot(
  whoResult: ReturnType<typeof extractWho>
): ParsedSlot<string> & { whoType: "solo" | "one-on-one" | "group" | "team" } {
  return {
    value: whoResult.who,
    rawMatch: whoResult.matchedText,
    confidence: whoResult.confidence,
    source: "rule",
    whoType: whoResult.whoType,
  }
}

/**
 * Build the priority slot
 */
function buildPrioritySlot(
  priorityResult: ReturnType<typeof extractPriority>
): ParsedSlot<TaskPriority> | null {
  if (!priorityResult) return null

  return {
    value: priorityResult.priority,
    rawMatch: priorityResult.matchedText,
    confidence: priorityResult.confidence,
    source: "rule",
  }
}

/**
 * Collect all matched patterns for debugging
 */
function collectMatchedPatterns(
  dateResult: ReturnType<typeof extractDate>,
  timeResult: ReturnType<typeof extractTime>,
  locationResult: ReturnType<typeof extractLocation>,
  intentResult: ReturnType<typeof classifyIntent>,
  priorityResult: ReturnType<typeof extractPriority>
): string[] {
  const patterns: string[] = []

  if (dateResult) patterns.push(`date:${dateResult.matchedText}`)
  if (timeResult) patterns.push(`time:${timeResult.matchedText}`)
  if (locationResult) patterns.push(`location:${locationResult.rawMatch}`)
  if (intentResult) patterns.push(`intent:${intentResult.matchedKeywords.join(",")}`)
  if (priorityResult) patterns.push(`priority:${priorityResult.matchedText}`)

  return patterns
}

// Re-export types and utilities
export {
  calculateOverallConfidence,
  getConfidenceLevel,
  buildSuggestedTask,
  getSuggestions,
  getMissingFields,
} from "./confidence-scorer"

export {
  extractLocation,
  expandMalaysianAbbreviations,
  MALAYSIAN_LOCATIONS,
  MALAYSIA_TIMEZONE,
} from "./malaysian-context"

export { extractDate } from "./entity-extractors/date-extractor"
export { extractTime, extractDuration } from "./entity-extractors/time-extractor"
export { extractPriority, removePriorityFromText } from "./entity-extractors/priority-extractor"
export { classifyIntent, getAllIntentScores } from "./intent-classifier"
export { matchToGoals, findGoalForAspect } from "./goal-matcher"
export { parseFrequencyFromTitle, matchesAction } from "./frequency-parser"
