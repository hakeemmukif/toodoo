import type { AppSettings, JournalPrompt, PromptCategory } from "@/lib/types"
import { JOURNAL_PROMPTS, getRandomPrompt, getPromptById } from "@/lib/prompts"
import { db } from "@/db"

/**
 * Get today's journal prompt based on settings and history
 */
export async function getTodaysPrompt(
  settings: AppSettings,
  recentPromptIds: string[] = []
): Promise<JournalPrompt | null> {
  if (settings.journalPromptMode === "none") {
    return null
  }

  if (settings.journalPromptMode === "pick") {
    // Return null - user will pick from list
    return null
  }

  // Rotating mode - get a random prompt
  return getRandomPrompt(
    settings.preferredPromptCategories,
    recentPromptIds,
    "daily"
  )
}

/**
 * Get recent prompt IDs from journal entries
 */
export async function getRecentPromptIds(limit: number = 5): Promise<string[]> {
  const entries = await db.journalEntries
    .orderBy("timestamp")
    .reverse()
    .limit(limit)
    .toArray()

  return entries
    .map((e) => e.promptUsed)
    .filter((id): id is string => id !== undefined)
}

/**
 * Get prompts for selection UI
 */
export function getPromptsForSelection(
  preferredCategories: PromptCategory[] = [],
  frequency: JournalPrompt["frequency"] = "daily"
): JournalPrompt[] {
  let prompts = JOURNAL_PROMPTS.filter((p) => p.frequency === frequency)

  if (preferredCategories.length > 0) {
    prompts = prompts.filter((p) => preferredCategories.includes(p.category))
  }

  return prompts
}

/**
 * Get weekly prompts for weekly review
 */
export function getWeeklyPrompts(): JournalPrompt[] {
  return JOURNAL_PROMPTS.filter((p) => p.frequency === "weekly")
}

/**
 * Get quarterly prompts for deeper reflection
 */
export function getQuarterlyPrompts(): JournalPrompt[] {
  return JOURNAL_PROMPTS.filter((p) => p.frequency === "quarterly")
}

/**
 * Check if it's time for weekly review
 */
export function isWeeklyReviewTime(settings: AppSettings): boolean {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

  // Check if it's the right day
  if (currentDay !== settings.weeklyReviewDay) {
    return false
  }

  // Check if it's at or past the review time
  return currentTime >= settings.weeklyReviewTime
}

/**
 * Get prompt category display name
 */
export function getCategoryDisplayName(category: PromptCategory): string {
  const names: Record<PromptCategory, string> = {
    energy: "Energy & Sleep",
    resistance: "Facing Resistance",
    consistency: "Showing Up",
    focus: "Deep Focus",
    priority: "What Matters",
    progress: "Compound Gains",
    honesty: "Self-Assessment",
    clarity: "Mental Clarity",
    general: "Open Reflection",
  }
  return names[category]
}

/**
 * Get all available prompt categories
 */
export function getAllCategories(): PromptCategory[] {
  return [
    "energy",
    "resistance",
    "consistency",
    "focus",
    "priority",
    "progress",
    "honesty",
    "clarity",
    "general",
  ]
}

export { getPromptById, getRandomPrompt }
