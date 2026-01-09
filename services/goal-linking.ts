/**
 * Goal-Task Linking Service
 *
 * Handles intelligent auto-linking of tasks to weekly goals based on:
 * - Aspect matching (fitness task → fitness weekly goal)
 * - Date matching (task date falls within goal's week)
 * - Frequency goals (habit goals like "train 4x/week")
 */

import { db } from "@/db"
import type { LifeAspect, WeeklyGoal, Task, MonthlyGoal } from "@/lib/types"

/**
 * Get ISO week string from a date (e.g., "2026-W02")
 */
export function getWeekString(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`
}

/**
 * Find the best matching weekly goal for a task based on aspect and date
 */
export async function findMatchingWeeklyGoal(
  aspect: LifeAspect,
  scheduledDate: string
): Promise<WeeklyGoal | null> {
  const weeklyGoals = await db.weeklyGoals.where("aspect").equals(aspect).toArray()

  if (weeklyGoals.length === 0) return null

  // Get the week string for the scheduled date
  const taskWeek = getWeekString(new Date(scheduledDate))

  // Find active weekly goals for this week
  const matchingGoals = weeklyGoals.filter(
    (wg) => wg.status === "active" && wg.week === taskWeek
  )

  // Prefer goals with frequency (habit goals)
  const habitGoal = matchingGoals.find((wg) => wg.frequency)
  if (habitGoal) return habitGoal

  // Otherwise return first matching goal
  return matchingGoals[0] || null
}

/**
 * Get week progress for a habit goal
 * Returns { completed, target, remaining, tasks }
 */
export async function getWeekProgress(
  weeklyGoalId: string
): Promise<{
  completed: number
  target: number
  remaining: number
  tasks: Task[]
}> {
  const weeklyGoal = await db.weeklyGoals.get(weeklyGoalId)
  if (!weeklyGoal) {
    return { completed: 0, target: 0, remaining: 0, tasks: [] }
  }

  const target = weeklyGoal.frequency?.target || 0

  // Get tasks linked to this weekly goal
  const linkedTasks = await db.tasks
    .where("weeklyGoalId")
    .equals(weeklyGoalId)
    .toArray()

  const completed = linkedTasks.filter((t) => t.status === "done").length

  return {
    completed,
    target,
    remaining: Math.max(0, target - completed),
    tasks: linkedTasks,
  }
}

/**
 * Get all weekly goals for a yearly goal with their progress
 */
export async function getYearlyGoalWeekProgress(
  yearlyGoalId: string
): Promise<{
  currentWeekGoal: WeeklyGoal | null
  progress: { completed: number; target: number; remaining: number }
  allTasks: Task[]
}> {
  // Get monthly goals for this yearly goal
  const monthlyGoals = await db.monthlyGoals
    .where("yearlyGoalId")
    .equals(yearlyGoalId)
    .toArray()

  if (monthlyGoals.length === 0) {
    return {
      currentWeekGoal: null,
      progress: { completed: 0, target: 0, remaining: 0 },
      allTasks: [],
    }
  }

  const monthlyIds = monthlyGoals.map((m) => m.id)

  // Get weekly goals for those monthly goals
  const weeklyGoals = await db.weeklyGoals.toArray()
  const relatedWeekly = weeklyGoals.filter(
    (wg) => wg.monthlyGoalId && monthlyIds.includes(wg.monthlyGoalId)
  )

  // Find current week's goal
  const currentWeek = getWeekString(new Date())
  const currentWeekGoal = relatedWeekly.find(
    (wg) => wg.week === currentWeek && wg.status === "active"
  )

  if (!currentWeekGoal) {
    return {
      currentWeekGoal: null,
      progress: { completed: 0, target: 0, remaining: 0 },
      allTasks: [],
    }
  }

  const weekProgress = await getWeekProgress(currentWeekGoal.id)

  return {
    currentWeekGoal,
    progress: {
      completed: weekProgress.completed,
      target: weekProgress.target,
      remaining: weekProgress.remaining,
    },
    allTasks: weekProgress.tasks,
  }
}

/**
 * Generate suggested tasks for a habit goal to fill the week
 * Returns task templates (not yet created)
 */
export function suggestWeekTasks(
  weeklyGoal: WeeklyGoal,
  existingTaskDates: string[],
  aspect: LifeAspect
): { date: string; dayName: string }[] {
  if (!weeklyGoal.frequency) return []

  const target = weeklyGoal.frequency.target
  const existingCount = existingTaskDates.length
  const needed = Math.max(0, target - existingCount)

  if (needed === 0) return []

  // Get the week's dates
  const weekDates = getWeekDates(weeklyGoal.week)

  // Filter out dates that already have tasks
  const availableDates = weekDates.filter(
    (d) => !existingTaskDates.includes(d.date)
  )

  // Suggest evenly distributed days
  // For 4x/week, suggest Mon, Tue, Thu, Fri or similar
  const suggestions: { date: string; dayName: string }[] = []

  // Prioritize certain days based on the target
  const dayPriority = [1, 3, 5, 2, 4, 6, 0] // Mon, Wed, Fri, Tue, Thu, Sat, Sun

  const sortedAvailable = [...availableDates].sort((a, b) => {
    const dayA = new Date(a.date).getDay()
    const dayB = new Date(b.date).getDay()
    return dayPriority.indexOf(dayA) - dayPriority.indexOf(dayB)
  })

  for (let i = 0; i < needed && i < sortedAvailable.length; i++) {
    suggestions.push(sortedAvailable[i])
  }

  return suggestions
}

/**
 * Get all dates in a week from a week string
 */
function getWeekDates(weekString: string): { date: string; dayName: string }[] {
  // Parse "2026-W02" format
  const [yearStr, weekPart] = weekString.split("-W")
  const year = parseInt(yearStr)
  const week = parseInt(weekPart)

  // Find the first day of the week (Monday)
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const firstMonday = new Date(jan4)
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1)

  // Go to the target week
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7)

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const result: { date: string; dayName: string }[] = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    result.push({
      date: d.toISOString().split("T")[0],
      dayName: days[d.getDay()],
    })
  }

  return result
}

/**
 * Check if a task title matches a goal's action keyword
 */
export function taskMatchesGoalAction(
  taskTitle: string,
  goalAction?: string
): boolean {
  if (!goalAction) return true // No specific action required

  const normalizedTitle = taskTitle.toLowerCase()
  const normalizedAction = goalAction.toLowerCase()

  // Common variations
  const actionVariants = [
    normalizedAction,
    normalizedAction + "ing",
    normalizedAction + "ed",
  ]

  return actionVariants.some((variant) => normalizedTitle.includes(variant))
}
