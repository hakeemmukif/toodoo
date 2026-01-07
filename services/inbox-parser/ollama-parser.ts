/**
 * Ollama Parser
 *
 * Enhances rule-based parsing with LLM understanding when available.
 * Used for complex/ambiguous inputs where rules struggle.
 */

import type { ParsedResult, LifeAspect, TimePreference } from "@/lib/types"
import { checkOllamaConnection, queryOllama } from "@/services/ollama"

// Structured extraction prompt
const EXTRACTION_PROMPT = `You are an NLP entity extraction system for a Malaysian personal task manager.

Extract structured information from the user's natural language input.

USER INPUT: "{input}"

EXISTING EXTRACTIONS (from rule-based parser):
{ruleExtractions}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "what": {
    "value": "activity description",
    "confidence": 0.0-1.0
  },
  "when": {
    "date": "YYYY-MM-DD or null",
    "time": "HH:MM or null",
    "timePreference": "morning|afternoon|evening|anytime",
    "confidence": 0.0-1.0
  },
  "where": {
    "value": "location or null",
    "confidence": 0.0-1.0
  },
  "who": {
    "value": "people involved or null",
    "confidence": 0.0-1.0
  },
  "duration": {
    "value": null,
    "confidence": 0.0-1.0
  },
  "aspect": {
    "value": "fitness|nutrition|career|financial|side-projects|chores",
    "confidence": 0.0-1.0
  },
  "reasoning": "brief explanation of extraction logic"
}

CONTEXT:
- Current date: {currentDate}
- Timezone: Asia/Kuala_Lumpur (UTC+8)
- User interests: muay thai, DJing, fintech work
- Known locations: Bunker KD (gym), various Malaysian areas

IMPORTANT:
- Only fill fields you're confident about
- Return null for uncertain fields
- Malaysian context: "bunker" = gym, "kd" = Kota Damansara
- Training keywords -> fitness aspect
- Be conservative with confidence scores
- Duration value should be a number (minutes) or null`

// LLM extraction result interface
export interface OllamaExtractionResult {
  what?: { value: string; confidence: number }
  when?: {
    date: string | null
    time: string | null
    timePreference: TimePreference
    confidence: number
  }
  where?: { value: string | null; confidence: number }
  who?: { value: string | null; confidence: number }
  duration?: { value: number | null; confidence: number }
  aspect?: { value: LifeAspect; confidence: number }
  reasoning?: string
}

/**
 * Parse with Ollama LLM
 */
export async function parseWithOllama(
  input: string,
  ruleExtractions: Partial<ParsedResult>,
  config: { timeout?: number; model?: string } = {}
): Promise<OllamaExtractionResult | null> {
  const { timeout = 10000, model = "mistral" } = config

  // Check connection first
  const isConnected = await checkOllamaConnection()
  if (!isConnected) {
    return null
  }

  const currentDate = new Date().toISOString().split("T")[0]

  // Build prompt
  const prompt = EXTRACTION_PROMPT
    .replace("{input}", input)
    .replace("{ruleExtractions}", JSON.stringify(ruleExtractions, null, 2))
    .replace("{currentDate}", currentDate)

  try {
    // Race with timeout
    const response = await Promise.race([
      queryOllama(prompt, model),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout)
      ),
    ])

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn("Ollama response did not contain valid JSON")
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as OllamaExtractionResult

    // Validate and clean up the response
    return validateAndCleanResult(parsed)
  } catch (error) {
    console.warn("Ollama parsing failed:", error)
    return null
  }
}

/**
 * Validate and clean up LLM extraction result
 */
function validateAndCleanResult(result: OllamaExtractionResult): OllamaExtractionResult | null {
  if (!result) return null

  // Validate aspect is a valid LifeAspect
  const validAspects: LifeAspect[] = ["fitness", "nutrition", "career", "financial", "side-projects", "chores"]
  if (result.aspect?.value && !validAspects.includes(result.aspect.value)) {
    result.aspect = undefined
  }

  // Validate time preference
  const validTimePrefs: TimePreference[] = ["morning", "afternoon", "evening", "anytime"]
  if (result.when?.timePreference && !validTimePrefs.includes(result.when.timePreference)) {
    result.when.timePreference = "anytime"
  }

  // Validate date format (YYYY-MM-DD)
  if (result.when?.date && !/^\d{4}-\d{2}-\d{2}$/.test(result.when.date)) {
    result.when.date = null
  }

  // Validate time format (HH:MM)
  if (result.when?.time && !/^\d{2}:\d{2}$/.test(result.when.time)) {
    result.when.time = null
  }

  // Ensure confidence scores are between 0 and 1
  if (result.what?.confidence) {
    result.what.confidence = Math.max(0, Math.min(1, result.what.confidence))
  }
  if (result.when?.confidence) {
    result.when.confidence = Math.max(0, Math.min(1, result.when.confidence))
  }
  if (result.where?.confidence) {
    result.where.confidence = Math.max(0, Math.min(1, result.where.confidence))
  }
  if (result.aspect?.confidence) {
    result.aspect.confidence = Math.max(0, Math.min(1, result.aspect.confidence))
  }

  return result
}

/**
 * Merge rule-based and LLM results
 */
export function mergeExtractions(
  ruleResult: ParsedResult,
  ollamaResult: OllamaExtractionResult | null
): ParsedResult {
  if (!ollamaResult) return ruleResult

  const merged = { ...ruleResult }

  // Only override if LLM has higher confidence
  // What (activity)
  if (ollamaResult.what &&
      (!ruleResult.what || ollamaResult.what.confidence > ruleResult.what.confidence)) {
    merged.what = {
      value: ollamaResult.what.value,
      rawMatch: ollamaResult.what.value,
      confidence: ollamaResult.what.confidence,
      source: "llm",
    }
  }

  // Aspect (intent)
  if (ollamaResult.aspect &&
      (!ruleResult.intent || ollamaResult.aspect.confidence > ruleResult.intent.confidence)) {
    merged.intent = {
      value: ollamaResult.aspect.value,
      rawMatch: ollamaResult.aspect.value,
      confidence: ollamaResult.aspect.confidence,
      source: "llm",
    }
  }

  // Date
  if (ollamaResult.when?.date &&
      (!ruleResult.when?.date || ollamaResult.when.confidence > ruleResult.when.date.confidence)) {
    merged.when = {
      ...merged.when,
      date: {
        value: ollamaResult.when.date,
        rawMatch: ollamaResult.when.date,
        confidence: ollamaResult.when.confidence,
        source: "llm",
      },
      isRelative: false,
    }
  }

  // Time
  if (ollamaResult.when?.time &&
      (!ruleResult.when?.time || ollamaResult.when.confidence > (ruleResult.when.time?.confidence || 0))) {
    merged.when = {
      ...merged.when,
      time: {
        value: ollamaResult.when.time,
        rawMatch: ollamaResult.when.time,
        confidence: ollamaResult.when.confidence,
        source: "llm",
      },
      isRelative: merged.when?.isRelative ?? false,
    }
  }

  // Location
  if (ollamaResult.where?.value &&
      (!ruleResult.where || ollamaResult.where.confidence > ruleResult.where.confidence)) {
    merged.where = {
      value: ollamaResult.where.value,
      rawMatch: ollamaResult.where.value,
      confidence: ollamaResult.where.confidence,
      source: "llm",
    }
  }

  // Duration
  if (ollamaResult.duration?.value &&
      (!ruleResult.duration || ollamaResult.duration.confidence > ruleResult.duration.confidence)) {
    merged.duration = {
      value: ollamaResult.duration.value,
      rawMatch: String(ollamaResult.duration.value),
      confidence: ollamaResult.duration.confidence,
      source: "llm",
    }
  }

  // Who (people)
  if (ollamaResult.who?.value &&
      (!ruleResult.who || ollamaResult.who.confidence > ruleResult.who.confidence)) {
    // Classify whoType based on LLM extraction
    const lowerWho = ollamaResult.who.value.toLowerCase()
    let whoType: "solo" | "one-on-one" | "group" | "team" = "one-on-one"
    if (lowerWho === "solo" || lowerWho === "alone") {
      whoType = "solo"
    } else if (["team", "squad", "group", "class", "family", "friends"].some(g => lowerWho.includes(g))) {
      whoType = lowerWho.includes("team") || lowerWho.includes("squad") ? "team" : "group"
    }

    merged.who = {
      value: ollamaResult.who.value,
      rawMatch: ollamaResult.who.value,
      confidence: ollamaResult.who.confidence,
      source: "llm",
      whoType,
    }
  }

  // Update method to hybrid
  merged.parsingMethod = "hybrid"

  return merged
}

/**
 * Check if Ollama should be used for this parse
 */
export function shouldUseOllama(
  ruleConfidence: number,
  config: { enableOllama: boolean; minConfidenceForAutoFill: number }
): boolean {
  // Use Ollama if:
  // 1. Ollama is enabled
  // 2. Rule-based confidence is below threshold
  return config.enableOllama && ruleConfidence < config.minConfidenceForAutoFill
}
