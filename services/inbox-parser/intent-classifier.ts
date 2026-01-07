/**
 * Intent Classifier
 *
 * Classifies natural language text into LifeAspect categories.
 * Uses keyword matching with weighted scoring for confidence calculation.
 */

import type { LifeAspect } from "@/lib/types"

export interface IntentClassificationResult {
  aspect: LifeAspect
  confidence: number
  matchedKeywords: string[]
}

// Extended keyword mappings with weights
const INTENT_KEYWORDS: Record<LifeAspect, {
  primary: string[]    // High confidence keywords (+0.4)
  secondary: string[]  // Medium confidence keywords (+0.2)
  contextual: string[] // Context clues (+0.1)
}> = {
  fitness: {
    primary: [
      "training", "gym", "workout", "muay thai", "muaythai", "sparring",
      "run", "running", "cardio", "strength", "yoga", "boxing", "kickboxing",
      "swimming", "swim", "cycling", "cycle", "bike", "hiit", "crossfit",
      "exercise", "leg day", "arm day", "chest day", "back day",
      "stretch", "stretching", "warmup", "warm up", "cooldown", "cool down",
      "gymnastics", "calisthenics", "handstand", "backflip", "flip", "tumbling",
    ],
    secondary: [
      "fitness", "lift", "lifting", "weights", "bunker", "coach",
      "PT", "personal trainer", "class", "body", "muscle", "gains",
      "reps", "sets", "squat", "deadlift", "bench", "pull up", "pushup",
      "plank", "abs", "core", "flexibility", "mobility",
      "cartwheel", "somersault", "parkour", "freerunning", "tricking",
    ],
    contextual: [
      "session", "practice", "active", "sweat", "burn", "pump",
    ],
  },
  nutrition: {
    primary: [
      "cook", "cooking", "meal prep", "mealprep", "groceries", "grocery",
      "recipe", "breakfast", "lunch", "dinner", "snack", "meal",
      "food prep", "prep food", "make food", "prepare food",
    ],
    secondary: [
      "eat", "eating", "food", "kitchen", "ingredients", "shopping",
      "jaya grocer", "village grocer", "aeon", "cold storage",
      "protein", "vegetables", "fruits", "healthy", "diet",
      "bake", "baking", "fry", "grill", "steam", "boil",
    ],
    contextual: [
      "prep", "make", "buy", "market", "store", "hungry",
    ],
  },
  career: {
    primary: [
      "work", "meeting", "deadline", "project", "standup", "stand up",
      "code review", "deploy", "release", "presentation", "interview",
      "office", "paywatch", "fintech", "sprint", "jira", "ticket",
      "feature", "bug", "fix bug", "implement", "development",
    ],
    secondary: [
      "call", "conference", "email", "slack", "zoom", "teams",
      "client", "stakeholder", "manager", "colleague", "boss",
      "report", "document", "documentation", "submit", "review",
      "PR", "pull request", "merge", "branch", "commit",
    ],
    contextual: [
      "finish", "complete", "task", "todo", "followup", "follow up",
      "sync", "catch up", "update", "status",
    ],
  },
  financial: {
    primary: [
      "pay", "payment", "transfer", "bill", "bills", "savings", "save",
      "invest", "investment", "budget", "budgeting", "epf", "kwsp",
      "tax", "taxes", "income", "expense", "expenses",
    ],
    secondary: [
      "bank", "banking", "maybank", "cimb", "touch n go", "tng",
      "grab pay", "boost", "duit", "money", "ringgit", "rm",
      "deposit", "withdraw", "account", "balance", "transaction",
      "insurance", "loan", "mortgage", "credit", "debit",
    ],
    contextual: [
      "check", "review", "track", "allocate", "spend", "spending",
    ],
  },
  "side-projects": {
    primary: [
      "dj", "djing", "mix", "mixing", "rekordbox", "music", "set",
      "tracks", "ddj", "vinyl", "turntable", "controller",
      "build", "building", "code", "coding", "mvp", "launch", "ship",
      "app", "website", "project", "side project", "sideproject",
    ],
    secondary: [
      "practice", "creative", "create", "design", "designing",
      "record", "recording", "produce", "production", "beat",
      "french house", "nu disco", "disco", "funk", "electronic",
      "transition", "blend", "beatmatch", "cue", "loop",
      "github", "repo", "repository", "prototype", "demo",
    ],
    contextual: [
      "work on", "tinker", "experiment", "learn", "tutorial",
      "course", "youtube", "watch", "study",
    ],
  },
  chores: {
    primary: [
      "clean", "cleaning", "laundry", "vacuum", "vacuuming",
      "mop", "mopping", "wash", "washing", "dishes", "ironing",
      "tidy", "tidying", "organize", "organizing", "declutter",
      "fix", "repair", "repairing", "maintenance",
    ],
    secondary: [
      "errands", "errand", "appointment", "dentist", "doctor",
      "car service", "service", "renew", "renewal", "license",
      "passport", "ic", "utility", "utilities", "garbage", "trash",
      "recycle", "recycling", "sort", "sorting", "fold", "folding",
    ],
    contextual: [
      "take care of", "handle", "deal with", "sort out",
      "home", "house", "room", "bathroom", "bedroom", "kitchen",
    ],
  },
}

/**
 * Classify text into a LifeAspect
 */
export function classifyIntent(text: string): IntentClassificationResult | null {
  const lowerText = text.toLowerCase()
  const results: IntentClassificationResult[] = []

  for (const [aspect, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0
    const matched: string[] = []

    // Primary keywords: +0.4 each (cap at 0.8 from primaries alone)
    for (const kw of keywords.primary) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += 0.4
        matched.push(kw)
      }
    }
    score = Math.min(score, 0.8) // Cap primary contribution

    // Secondary keywords: +0.2 each (cap at 0.4)
    let secondaryScore = 0
    for (const kw of keywords.secondary) {
      if (lowerText.includes(kw.toLowerCase())) {
        secondaryScore += 0.2
        matched.push(kw)
      }
    }
    score += Math.min(secondaryScore, 0.4)

    // Contextual: +0.1 each (cap at 0.2)
    let contextualScore = 0
    for (const kw of keywords.contextual) {
      if (lowerText.includes(kw.toLowerCase())) {
        contextualScore += 0.1
        matched.push(kw)
      }
    }
    score += Math.min(contextualScore, 0.2)

    if (matched.length > 0) {
      results.push({
        aspect: aspect as LifeAspect,
        confidence: Math.min(score, 1.0),
        matchedKeywords: [...new Set(matched)], // Remove duplicates
      })
    }
  }

  if (results.length === 0) return null

  // Return highest confidence match
  const sorted = results.sort((a, b) => b.confidence - a.confidence)

  // If top two are very close, indicate lower confidence
  if (sorted.length >= 2 && sorted[0].confidence - sorted[1].confidence < 0.1) {
    sorted[0].confidence *= 0.9 // Reduce confidence when ambiguous
  }

  return sorted[0]
}

/**
 * Get all possible intents with their confidence scores
 */
export function getAllIntentScores(text: string): IntentClassificationResult[] {
  const lowerText = text.toLowerCase()
  const results: IntentClassificationResult[] = []

  for (const [aspect, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0
    const matched: string[] = []

    for (const kw of keywords.primary) {
      if (lowerText.includes(kw.toLowerCase())) {
        score += 0.4
        matched.push(kw)
      }
    }
    score = Math.min(score, 0.8)

    let secondaryScore = 0
    for (const kw of keywords.secondary) {
      if (lowerText.includes(kw.toLowerCase())) {
        secondaryScore += 0.2
        matched.push(kw)
      }
    }
    score += Math.min(secondaryScore, 0.4)

    let contextualScore = 0
    for (const kw of keywords.contextual) {
      if (lowerText.includes(kw.toLowerCase())) {
        contextualScore += 0.1
        matched.push(kw)
      }
    }
    score += Math.min(contextualScore, 0.2)

    results.push({
      aspect: aspect as LifeAspect,
      confidence: Math.min(score, 1.0),
      matchedKeywords: [...new Set(matched)],
    })
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Infer activity description from text
 */
export function inferActivityDescription(
  text: string,
  intent: IntentClassificationResult | null
): string {
  // Try to extract the main action/activity from the text
  // Remove time/date references and locations

  let activity = text
    // Remove common time patterns
    .replace(/\b(today|tomorrow|yesterday|morning|afternoon|evening|night)\b/gi, "")
    .replace(/\b\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
    .replace(/\b(at|on|for|from|by)\s+\d/gi, "")
    // Remove common location patterns
    .replace(/\b(at|in)\s+[a-z\s]+$/gi, "")
    // Clean up
    .replace(/\s+/g, " ")
    .trim()

  // If nothing left or very short, use first matched keyword as base
  if (activity.length < 3 && intent?.matchedKeywords.length) {
    activity = intent.matchedKeywords[0]
  }

  // Capitalize first letter
  return activity.charAt(0).toUpperCase() + activity.slice(1)
}
