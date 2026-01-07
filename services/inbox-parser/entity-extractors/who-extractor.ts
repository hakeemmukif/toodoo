/**
 * WHO Extractor
 *
 * Extracts who the task is with from natural language text.
 * Defaults to "solo" when no companion is mentioned.
 *
 * Examples:
 * - "training with coach" → who: "coach", whoType: "one-on-one"
 * - "meeting with team" → who: "team", whoType: "group"
 * - "training" → who: "solo", whoType: "solo"
 */

export interface WhoExtractionResult {
  who: string
  whoType: "solo" | "one-on-one" | "group" | "team"
  confidence: number
  matchedText: string
}

// Patterns to extract WHO
const WHO_PATTERNS: Array<{
  pattern: RegExp
  extractor: (match: RegExpMatchArray) => { who: string; whoType: WhoExtractionResult["whoType"] }
}> = [
  // "with [person/group]"
  {
    pattern: /\bwith\s+(my\s+)?([\w\s]+?)(?:\s+(?:at|on|in|from|until|tomorrow|today|tonight)|$)/i,
    extractor: (match) => {
      const who = cleanWhoPart(match[2])
      return { who, whoType: classifyWhoType(who) }
    },
  },
  // "and [person]"
  {
    pattern: /\band\s+([\w]+)(?:\s+(?:at|on|in|from|will)|\s*$)/i,
    extractor: (match) => {
      const who = cleanWhoPart(match[1])
      // Only use if it looks like a person (not "and buy" or "and cook")
      if (isLikelyPerson(who)) {
        return { who, whoType: classifyWhoType(who) }
      }
      return { who: "solo", whoType: "solo" }
    },
  },
  // "solo" or "alone" explicit
  {
    pattern: /\b(solo|alone|by myself)\b/i,
    extractor: () => ({ who: "solo", whoType: "solo" }),
  },
  // "together with [person]"
  {
    pattern: /\btogether\s+with\s+([\w\s]+?)(?:\s+(?:at|on|in)|$)/i,
    extractor: (match) => {
      const who = cleanWhoPart(match[1])
      return { who, whoType: classifyWhoType(who) }
    },
  },
  // "[person]'s" (possessive, indicates who)
  {
    pattern: /\b([\w]+)'s\s+(?:session|class|training|meeting|call)/i,
    extractor: (match) => {
      const who = cleanWhoPart(match[1])
      return { who, whoType: "one-on-one" }
    },
  },
]

// Keywords that indicate group activities
const GROUP_INDICATORS = [
  "team",
  "group",
  "class",
  "squad",
  "crew",
  "gang",
  "colleagues",
  "friends",
  "family",
  "everyone",
  "all",
]

// Keywords that indicate one-on-one
const ONE_ON_ONE_INDICATORS = [
  "coach",
  "trainer",
  "teacher",
  "instructor",
  "mentor",
  "boss",
  "manager",
  "client",
  "partner",
  "wife",
  "husband",
  "girlfriend",
  "boyfriend",
]

// Words that are NOT people (to filter out false positives)
const NOT_PERSON_WORDS = [
  "buy",
  "cook",
  "eat",
  "go",
  "do",
  "make",
  "get",
  "take",
  "finish",
  "complete",
  "start",
  "end",
  "review",
  "check",
  "clean",
  "prepare",
  "submit",
  "send",
  "call",
  "email",
  "message",
]

/**
 * Extract WHO from text
 */
export function extractWho(text: string): WhoExtractionResult {
  const normalizedText = text.toLowerCase().trim()

  // Try each pattern
  for (const { pattern, extractor } of WHO_PATTERNS) {
    const match = normalizedText.match(pattern)
    if (match) {
      const result = extractor(match)
      if (result.who && result.who !== "solo") {
        return {
          who: result.who,
          whoType: result.whoType,
          confidence: 0.85,
          matchedText: match[0],
        }
      }
    }
  }

  // Default to solo
  return {
    who: "solo",
    whoType: "solo",
    confidence: 1.0, // High confidence for default
    matchedText: "",
  }
}

/**
 * Clean up extracted who string
 */
function cleanWhoPart(who: string): string {
  return who
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(the|a|an)\s+/i, "") // Remove articles
    .toLowerCase()
}

/**
 * Check if a word is likely a person/group name
 */
function isLikelyPerson(who: string): boolean {
  const lower = who.toLowerCase()

  // Check if it's explicitly NOT a person word
  if (NOT_PERSON_WORDS.includes(lower)) {
    return false
  }

  // Check if it matches known indicators
  if (
    GROUP_INDICATORS.includes(lower) ||
    ONE_ON_ONE_INDICATORS.includes(lower)
  ) {
    return true
  }

  // If single word and not in NOT_PERSON list, could be a name
  if (!lower.includes(" ") && lower.length > 2) {
    return true
  }

  return false
}

/**
 * Classify who type based on the who string
 */
function classifyWhoType(who: string): WhoExtractionResult["whoType"] {
  const lower = who.toLowerCase()

  // Check for group indicators
  for (const indicator of GROUP_INDICATORS) {
    if (lower.includes(indicator)) {
      return "group"
    }
  }

  // Check for one-on-one indicators
  for (const indicator of ONE_ON_ONE_INDICATORS) {
    if (lower.includes(indicator)) {
      return "one-on-one"
    }
  }

  // Check for team-specific
  if (lower.includes("team") || lower.includes("squad")) {
    return "team"
  }

  // Default to one-on-one if a specific person is mentioned
  if (who !== "solo") {
    return "one-on-one"
  }

  return "solo"
}
