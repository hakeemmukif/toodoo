/**
 * Goal Matcher
 *
 * Matches parsed inbox items to existing goals based on:
 * 1. Aspect match (required) - fitness task -> fitness goals only
 * 2. Temporal match - task date within goal's week/month
 * 3. Keyword match - "training" <-> "train 4x/week"
 * 4. Frequency progress - count existing tasks toward goal
 */

import { db } from "@/db"
import type { LifeAspect, GoalMatch, WeeklyGoal, Task } from "@/lib/types"
import { parseFrequencyFromTitle, matchesAction } from "./frequency-parser"
import { getWeekNumber, getWeekStart, getWeekEnd } from "./date-utils"

export interface MatchInput {
  aspect: LifeAspect | null
  scheduledDate: string | null // "2026-01-07"
  activity: string | null // "Training"
  location?: string | null
}

export interface MatchResult {
  bestMatch: GoalMatch | null
  alternatives: GoalMatch[]
}

/**
 * Match parsed inbox data to existing goals
 */
export async function matchToGoals(input: MatchInput): Promise<MatchResult> {
  // Early return if no aspect detected
  if (!input.aspect) {
    return { bestMatch: null, alternatives: [] }
  }

  try {
    // Get all active weekly goals for this aspect
    const weeklyGoals = await db.weeklyGoals
      .where("aspect")
      .equals(input.aspect)
      .toArray()

    // Filter to active goals only
    const activeGoals = weeklyGoals.filter((g) => g.status === "active")

    if (activeGoals.length === 0) {
      return { bestMatch: null, alternatives: [] }
    }

    // Score each goal
    const scoredGoals = await Promise.all(
      activeGoals.map((goal) => scoreGoalMatch(goal, input))
    )

    // Sort by confidence, filter low matches
    const sorted = scoredGoals
      .filter((g) => g.matchConfidence >= 0.3)
      .sort((a, b) => b.matchConfidence - a.matchConfidence)

    return {
      bestMatch: sorted[0] ?? null,
      alternatives: sorted.slice(1, 4), // Top 3 alternatives
    }
  } catch (error) {
    console.error("Goal matching error:", error)
    return { bestMatch: null, alternatives: [] }
  }
}

/**
 * Score how well a goal matches the input
 */
async function scoreGoalMatch(
  goal: WeeklyGoal,
  input: MatchInput
): Promise<GoalMatch> {
  const reasons: string[] = []
  let confidence = 0

  // Aspect match (base confidence) - already filtered, but confirm
  if (goal.aspect === input.aspect) {
    confidence += 0.3
    reasons.push(`aspect:${input.aspect}`)
  }

  // Temporal match - check if task date falls within goal's week
  if (input.scheduledDate && goal.week) {
    if (isDateInWeek(input.scheduledDate, goal.week)) {
      confidence += 0.3
      reasons.push("temporal:this-week")
    }
  }

  // Keyword match - check if activity matches goal's action
  const frequency = goal.frequency ?? parseFrequencyFromTitle(goal.title)
  if (frequency?.action && input.activity) {
    if (matchesAction(input.activity, frequency.action)) {
      confidence += 0.3
      reasons.push(`keyword:${frequency.action}`)
    }
  } else if (input.activity && goal.title) {
    // Fallback: check if activity appears in goal title
    if (goal.title.toLowerCase().includes(input.activity.toLowerCase().slice(0, -3))) {
      confidence += 0.2
      reasons.push("keyword:title-match")
    }
  }

  // Calculate frequency progress if frequency is defined
  let frequencyProgress: GoalMatch["frequencyProgress"] = undefined
  if (frequency) {
    const tasks = await getTasksForGoalInPeriod(
      goal.id,
      frequency.period,
      input.scheduledDate
    )
    frequencyProgress = {
      current: tasks.length,
      target: frequency.target,
      period: frequency.period,
    }
  }

  return {
    goalId: goal.id,
    goalTitle: goal.title,
    goalLevel: "weekly",
    weeklyGoalId: goal.id,
    matchConfidence: Math.min(confidence, 1),
    matchReasons: reasons,
    frequencyProgress,
  }
}

/**
 * Check if a date string falls within a week string (ISO format)
 * @param dateStr "2026-01-07"
 * @param weekStr "2026-W02"
 */
function isDateInWeek(dateStr: string, weekStr: string): boolean {
  try {
    const date = new Date(dateStr)
    const dateWeek = getWeekNumber(date)
    const dateYear = date.getFullYear()

    // Parse week string "2026-W02"
    const match = weekStr.match(/^(\d{4})-W(\d{2})$/)
    if (!match) return false

    const goalYear = parseInt(match[1], 10)
    const goalWeek = parseInt(match[2], 10)

    return dateYear === goalYear && dateWeek === goalWeek
  } catch {
    return false
  }
}

/**
 * Get tasks linked to a goal within a time period
 */
async function getTasksForGoalInPeriod(
  weeklyGoalId: string,
  period: "day" | "week" | "month",
  referenceDate: string | null
): Promise<Task[]> {
  try {
    // Get all tasks for this goal
    const tasks = await db.tasks
      .where("weeklyGoalId")
      .equals(weeklyGoalId)
      .toArray()

    if (!referenceDate) {
      return tasks
    }

    const refDate = new Date(referenceDate)

    // Filter by period
    return tasks.filter((task) => {
      const taskDate = new Date(task.scheduledDate)

      switch (period) {
        case "day":
          return task.scheduledDate === referenceDate

        case "week": {
          const weekStart = getWeekStart(refDate)
          const weekEnd = getWeekEnd(refDate)
          return taskDate >= weekStart && taskDate <= weekEnd
        }

        case "month": {
          return (
            taskDate.getFullYear() === refDate.getFullYear() &&
            taskDate.getMonth() === refDate.getMonth()
          )
        }

        default:
          return true
      }
    })
  } catch (error) {
    console.error("Error getting tasks for goal:", error)
    return []
  }
}

/**
 * Find the best matching goal for a given aspect and activity
 * Simpler version that doesn't require full MatchInput
 */
export async function findGoalForAspect(
  aspect: LifeAspect,
  activity?: string
): Promise<GoalMatch | null> {
  const result = await matchToGoals({
    aspect,
    scheduledDate: new Date().toISOString().split("T")[0],
    activity: activity ?? null,
    location: null,
  })
  return result.bestMatch
}
