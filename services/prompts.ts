import type { AppSettings, JournalPrompt, PromptCategory, YearlyGoal, LifeAspect } from "@/lib/types"
import { JOURNAL_PROMPTS, getRandomPrompt, getPromptById } from "@/lib/prompts"
import { db } from "@/db"

// Goal-based prompt templates
const GOAL_PROMPT_TEMPLATES = [
  // Progress-focused
  (goal: YearlyGoal) => `How did you move closer to "${goal.title}" today?`,
  (goal: YearlyGoal) => `What action did you take today toward "${goal.title}"?`,
  (goal: YearlyGoal) => `Rate your progress on "${goal.title}" today: 1-5. What affected it?`,

  // Identity-focused (if identityStatement exists)
  (goal: YearlyGoal) =>
    goal.identityStatement
      ? `Did you act like someone who ${goal.identityStatement.toLowerCase()} today?`
      : `Did you act in alignment with "${goal.title}" today?`,

  // Resistance-focused
  (goal: YearlyGoal) => `What resistance showed up around "${goal.title}" today?`,
  (goal: YearlyGoal) => `What's blocking you from making progress on "${goal.title}"?`,

  // Reflection-focused
  (goal: YearlyGoal) => `What did you learn today that helps with "${goal.title}"?`,
  (goal: YearlyGoal) => `How confident are you in achieving "${goal.title}"? What would change that?`,
]

// Aspect-specific prompt templates
const ASPECT_PROMPT_TEMPLATES: Record<LifeAspect, ((goal: YearlyGoal) => string)[]> = {
  fitness: [
    (goal) => `Did you train today? How does it connect to "${goal.title}"?`,
    (goal) => `What's your body telling you about "${goal.title}"?`,
  ],
  nutrition: [
    (goal) => `Did you cook today? How does it support "${goal.title}"?`,
    (goal) => `What food choices did you make today that align with "${goal.title}"?`,
  ],
  career: [
    (goal) => `What career move did you make today toward "${goal.title}"?`,
    (goal) => `Did you do deep work today that advances "${goal.title}"?`,
  ],
  financial: [
    (goal) => `How did your spending today align with "${goal.title}"?`,
    (goal) => `What financial decision did you make today?`,
  ],
  "side-projects": [
    (goal) => `Did you work on "${goal.title}" today? What did you do?`,
    (goal) => `What creative progress did you make on "${goal.title}"?`,
  ],
  chores: [
    (goal) => `What did you handle today that supports "${goal.title}"?`,
    (goal) => `Is your environment supporting "${goal.title}"?`,
  ],
}

/**
 * Generate dynamic prompts from active goals
 */
export async function generateGoalPrompts(): Promise<JournalPrompt[]> {
  const activeGoals = await db.yearlyGoals
    .where("status")
    .equals("active")
    .toArray()

  if (activeGoals.length === 0) {
    return []
  }

  const goalPrompts: JournalPrompt[] = []

  for (const goal of activeGoals) {
    // Add general templates
    const generalTemplates = GOAL_PROMPT_TEMPLATES
    const selectedGeneral = generalTemplates[Math.floor(Math.random() * generalTemplates.length)]

    goalPrompts.push({
      id: `goal-${goal.id}-general`,
      category: "progress" as PromptCategory,
      prompt: selectedGeneral(goal),
      frequency: "daily",
      aspect: goal.aspect,
    })

    // Add aspect-specific templates
    const aspectTemplates = ASPECT_PROMPT_TEMPLATES[goal.aspect]
    if (aspectTemplates && aspectTemplates.length > 0) {
      const selectedAspect = aspectTemplates[Math.floor(Math.random() * aspectTemplates.length)]

      goalPrompts.push({
        id: `goal-${goal.id}-aspect`,
        category: "progress" as PromptCategory,
        prompt: selectedAspect(goal),
        frequency: "daily",
        aspect: goal.aspect,
      })
    }
  }

  return goalPrompts
}

/**
 * Get a smart prompt - 50% goal-based, 50% static rotation
 */
export async function getSmartPrompt(
  settings: AppSettings,
  recentPromptIds: string[] = []
): Promise<{ prompt: JournalPrompt; goalContext?: string } | null> {
  if (settings.journalPromptMode === "none") {
    return null
  }

  // 50% chance to use goal-based prompt
  const useGoalPrompt = Math.random() < 0.5

  if (useGoalPrompt) {
    const goalPrompts = await generateGoalPrompts()

    if (goalPrompts.length > 0) {
      // Filter out recent prompts
      const recentSet = new Set(recentPromptIds.slice(0, 5))
      const eligible = goalPrompts.filter((p) => !recentSet.has(p.id))

      if (eligible.length > 0) {
        const selected = eligible[Math.floor(Math.random() * eligible.length)]

        // Extract goal ID from prompt ID for context
        const goalIdMatch = selected.id.match(/goal-([^-]+)-/)
        const goalContext = goalIdMatch ? goalIdMatch[1] : undefined

        return { prompt: selected, goalContext }
      }
    }
  }

  // Fall back to static prompts
  const staticPrompt = getRandomPrompt(
    settings.preferredPromptCategories,
    recentPromptIds,
    "daily"
  )

  return staticPrompt ? { prompt: staticPrompt } : null
}

/**
 * Get all available prompts including goal-based ones
 */
export async function getAllAvailablePrompts(
  preferredCategories: PromptCategory[] = [],
  frequency: JournalPrompt["frequency"] = "daily"
): Promise<JournalPrompt[]> {
  let staticPrompts = JOURNAL_PROMPTS.filter((p) => p.frequency === frequency)

  if (preferredCategories.length > 0) {
    staticPrompts = staticPrompts.filter((p) => preferredCategories.includes(p.category))
  }

  const goalPrompts = await generateGoalPrompts()

  return [...staticPrompts, ...goalPrompts]
}

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
