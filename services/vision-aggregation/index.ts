import type { DailyExcavation, ExcavationTheme, ExcavationResponse } from "@/lib/types"

/**
 * Aggregated vision data extracted from daily excavations.
 * This is the intermediate structure before creating/updating EmergentVision.
 */
interface AggregatedVision {
  antiVisionStatements: string[]
  visionStatements: string[]
  identityWins: string[]
  brokenRules: string[]
}

/**
 * Theme to aggregated field mapping.
 * Each excavation theme contributes to a specific aspect of the emergent vision.
 */
const THEME_TO_FIELD: Record<ExcavationTheme, keyof AggregatedVision | null> = {
  "direction": null, // Direction is for weekly planning, not vision building
  "anti-vision": "antiVisionStatements",
  "identity": "identityWins",
  "resistance": null, // Resistance insights go to journal, not vision
  "vision": "visionStatements",
  "constraints": "brokenRules",
  "synthesis": null, // Synthesis is reflection, not vision building
}

/**
 * Extract non-empty answers from excavation responses.
 * Preserves raw user input exactly as written - NEVER modify user's words.
 */
function extractAnswers(responses: ExcavationResponse[]): string[] {
  return responses
    .filter((r) => !r.skipped && r.answer.trim().length > 0)
    .map((r) => r.answer.trim())
}

/**
 * Remove duplicate statements while preserving order.
 * Uses case-insensitive comparison but keeps original casing.
 */
function deduplicateStatements(statements: string[]): string[] {
  const seen = new Set<string>()
  return statements.filter((statement) => {
    const normalized = statement.toLowerCase()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

/**
 * Aggregate all completed excavations into emergent vision components.
 *
 * The aggregation groups responses by theme:
 * - anti-vision theme responses → antiVisionStatements
 * - vision theme responses → visionStatements
 * - identity theme responses → identityWins
 * - constraints theme responses → brokenRules (informing constraints)
 *
 * Raw user words are preserved - never AI-rewritten.
 */
export function aggregateExcavationsToVision(
  excavations: DailyExcavation[]
): AggregatedVision {
  const result: AggregatedVision = {
    antiVisionStatements: [],
    visionStatements: [],
    identityWins: [],
    brokenRules: [],
  }

  // Sort by date to ensure chronological order (most recent last)
  const sorted = [...excavations].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (const excavation of sorted) {
    const field = THEME_TO_FIELD[excavation.theme]
    if (!field) continue

    const answers = extractAnswers(excavation.responses)
    result[field].push(...answers)
  }

  // Deduplicate while preserving order
  return {
    antiVisionStatements: deduplicateStatements(result.antiVisionStatements),
    visionStatements: deduplicateStatements(result.visionStatements),
    identityWins: deduplicateStatements(result.identityWins),
    brokenRules: deduplicateStatements(result.brokenRules),
  }
}

/**
 * Get a vision progress summary for display.
 * Returns percentage of vision components that have content.
 */
export function getVisionCompleteness(vision: AggregatedVision): {
  percentage: number
  hasAntiVision: boolean
  hasVision: boolean
  hasIdentity: boolean
  hasConstraints: boolean
} {
  const hasAntiVision = vision.antiVisionStatements.length > 0
  const hasVision = vision.visionStatements.length > 0
  const hasIdentity = vision.identityWins.length > 0
  const hasConstraints = vision.brokenRules.length > 0

  const filledCount = [hasAntiVision, hasVision, hasIdentity, hasConstraints].filter(Boolean).length
  const percentage = Math.round((filledCount / 4) * 100)

  return {
    percentage,
    hasAntiVision,
    hasVision,
    hasIdentity,
    hasConstraints,
  }
}
