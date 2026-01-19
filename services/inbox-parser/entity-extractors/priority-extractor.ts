/**
 * Priority Extractor
 *
 * Extracts Todoist-style priority markers (p1, p2, p3, p4) from natural language text.
 * Priority 1 is highest (urgent), Priority 4 is lowest.
 */

import type { TaskPriority } from "@/lib/types"

export interface PriorityExtractionResult {
  priority: TaskPriority
  confidence: number
  matchedText: string
}

/**
 * Extract priority from text
 *
 * Searches for Todoist-style priority markers like "p1", "p2", "p3", "p4".
 * Returns the first match found (if multiple, uses highest priority / lowest number).
 */
export function extractPriority(text: string): PriorityExtractionResult | null {
  // Create new regex instance per call to avoid global flag state bug
  const priorityPattern = /\b(p[1-4])\b/gi
  const matches: { priority: TaskPriority; matchedText: string }[] = []

  // Find all priority markers in text
  let match
  while ((match = priorityPattern.exec(text)) !== null) {
    const priorityStr = match[1].toLowerCase()
    const priorityNum = parseInt(priorityStr.charAt(1), 10) as TaskPriority

    matches.push({
      priority: priorityNum,
      matchedText: match[0],
    })
  }

  // No matches found
  if (matches.length === 0) {
    return null
  }

  // If multiple priorities found, use the highest priority (lowest number)
  const bestMatch = matches.reduce((best, current) =>
    current.priority < best.priority ? current : best
  )

  return {
    priority: bestMatch.priority,
    confidence: 0.98, // High confidence - explicit marker
    matchedText: bestMatch.matchedText,
  }
}

/**
 * Remove priority markers from text
 *
 * Used to clean the title after extracting priority.
 * Removes the p1/p2/p3/p4 token and cleans up any extra whitespace.
 */
export function removePriorityFromText(text: string): string {
  return text
    .replace(/\b(p[1-4])\b/gi, "")
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .trim()
}
