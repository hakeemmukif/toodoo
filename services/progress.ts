import { db } from "@/db"
import type { LifeAspect, DailyStats, WeeklyStats, MonthlySummary } from "@/lib/types"
import { formatDate, getWeekString, getMonthString } from "@/db"
import { generatePatterns, getSentimentLabel } from "./analysis"

/**
 * Calculate weekly goal progress from tasks
 */
export async function calculateWeeklyProgress(weeklyGoalId: string): Promise<number> {
  const tasks = await db.tasks.where("weeklyGoalId").equals(weeklyGoalId).toArray()
  if (tasks.length === 0) return 0

  const completed = tasks.filter((t) => t.status === "done").length
  return Math.round((completed / tasks.length) * 100)
}

/**
 * Calculate monthly goal progress from weekly goals
 */
export async function calculateMonthlyProgress(monthlyGoalId: string): Promise<number> {
  const weeklyGoals = await db.weeklyGoals
    .where("monthlyGoalId")
    .equals(monthlyGoalId)
    .toArray()
  if (weeklyGoals.length === 0) return 0

  const progresses = await Promise.all(
    weeklyGoals.map((wg) => calculateWeeklyProgress(wg.id))
  )
  return Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
}

/**
 * Calculate yearly goal progress from monthly goals
 */
export async function calculateYearlyProgress(yearlyGoalId: string): Promise<number> {
  const monthlyGoals = await db.monthlyGoals
    .where("yearlyGoalId")
    .equals(yearlyGoalId)
    .toArray()
  if (monthlyGoals.length === 0) return 0

  const progresses = await Promise.all(
    monthlyGoals.map((mg) => calculateMonthlyProgress(mg.id))
  )
  return Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
}

/**
 * Calculate overall progress for an aspect
 */
export async function calculateAspectProgress(aspect: LifeAspect): Promise<number> {
  const yearlyGoals = await db.yearlyGoals
    .where("aspect")
    .equals(aspect)
    .and((g) => g.status === "active")
    .toArray()

  if (yearlyGoals.length === 0) return 0

  const progresses = await Promise.all(
    yearlyGoals.map((g) => calculateYearlyProgress(g.id))
  )
  return Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length)
}

/**
 * Generate daily stats for a specific date
 */
export async function getDailyStats(date: string): Promise<DailyStats> {
  const tasks = await db.tasks.where("scheduledDate").equals(date).toArray()
  const trainingSessions = await db.trainingSessions.where("date").equals(date).toArray()
  const meals = await db.meals.where("date").equals(date).toArray()
  const journals = await db.journalEntries.toArray()
  const dayJournals = journals.filter(
    (j) => formatDate(new Date(j.timestamp)) === date
  )

  const tasksPlanned = tasks.length
  const tasksCompleted = tasks.filter((t) => t.status === "done").length
  const tasksSkipped = tasks.filter((t) => t.status === "skipped").length
  const completionRate = tasksPlanned > 0 ? (tasksCompleted / tasksPlanned) * 100 : 0

  // Aspect breakdown
  const aspects: LifeAspect[] = [
    "fitness",
    "nutrition",
    "career",
    "financial",
    "side-projects",
    "chores",
  ]
  const aspectBreakdown = {} as Record<LifeAspect, { planned: number; completed: number }>

  for (const aspect of aspects) {
    const aspectTasks = tasks.filter((t) => t.aspect === aspect)
    aspectBreakdown[aspect] = {
      planned: aspectTasks.length,
      completed: aspectTasks.filter((t) => t.status === "done").length,
    }
  }

  // Overall sentiment
  const overallSentiment =
    dayJournals.length > 0
      ? dayJournals.reduce((sum, j) => sum + j.sentimentScore, 0) / dayJournals.length
      : undefined

  return {
    date,
    tasksPlanned,
    tasksCompleted,
    tasksSkipped,
    completionRate: Math.round(completionRate),
    aspectBreakdown,
    trainingLogged: trainingSessions.length > 0,
    mealsLogged: meals.length,
    journalWritten: dayJournals.length > 0,
    overallSentiment,
  }
}

/**
 * Generate weekly stats
 */
export async function getWeeklyStats(weekStart: Date): Promise<WeeklyStats> {
  const week = getWeekString(weekStart)
  const dailyStats: DailyStats[] = []

  // Get stats for each day of the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const stats = await getDailyStats(formatDate(date))
    dailyStats.push(stats)
  }

  // Calculate aspect progress
  const aspects: LifeAspect[] = [
    "fitness",
    "nutrition",
    "career",
    "financial",
    "side-projects",
    "chores",
  ]
  const aspectProgress = {} as Record<LifeAspect, number>

  for (const aspect of aspects) {
    const planned = dailyStats.reduce(
      (sum, d) => sum + d.aspectBreakdown[aspect].planned,
      0
    )
    const completed = dailyStats.reduce(
      (sum, d) => sum + d.aspectBreakdown[aspect].completed,
      0
    )
    aspectProgress[aspect] = planned > 0 ? Math.round((completed / planned) * 100) : 0
  }

  // Get weekly goal progress
  const weeklyGoals = await db.weeklyGoals.where("week").equals(week).toArray()
  const weeklyGoalProgress = await Promise.all(
    weeklyGoals.map(async (g) => ({
      goalId: g.id,
      title: g.title,
      progress: await calculateWeeklyProgress(g.id),
    }))
  )

  // Generate patterns
  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekStart.getDate() + 6)
  const weekStartStr = formatDate(weekStart)
  const weekEndStr = formatDate(weekEndDate)

  const tasks = await db.tasks
    .where("scheduledDate")
    .between(weekStartStr, weekEndStr, true, true)
    .toArray()
  const journals = await db.journalEntries.toArray()
  const weekJournals = journals.filter((j) => {
    const date = formatDate(new Date(j.timestamp))
    return date >= weekStartStr && date <= weekEndStr
  })
  const trainingSessions = await db.trainingSessions
    .where("date")
    .between(weekStartStr, weekEndStr, true, true)
    .toArray()
  const meals = await db.meals
    .where("date")
    .between(weekStartStr, weekEndStr, true, true)
    .toArray()

  const patterns = generatePatterns(tasks, weekJournals, trainingSessions, meals)

  return {
    week,
    dailyStats,
    patterns,
    aspectProgress,
    weeklyGoalProgress,
  }
}

/**
 * Generate monthly summary
 */
export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const monthStr = `${year}-${month.toString().padStart(2, "0")}`
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  const startStr = formatDate(startDate)
  const endStr = formatDate(endDate)

  // Get all data for the month
  const tasks = await db.tasks
    .where("scheduledDate")
    .between(startStr, endStr, true, true)
    .toArray()
  const journals = await db.journalEntries.toArray()
  const monthJournals = journals.filter((j) => {
    const date = formatDate(new Date(j.timestamp))
    return date >= startStr && date <= endStr
  })

  // Calculate aspect summaries
  const aspects: LifeAspect[] = [
    "fitness",
    "nutrition",
    "career",
    "financial",
    "side-projects",
    "chores",
  ]
  const aspectSummaries = {} as MonthlySummary["aspectSummaries"]

  for (const aspect of aspects) {
    const aspectTasks = tasks.filter((t) => t.aspect === aspect)
    const completed = aspectTasks.filter((t) => t.status === "done").length
    const taskCompletionRate =
      aspectTasks.length > 0 ? Math.round((completed / aspectTasks.length) * 100) : 0

    const aspectJournals = monthJournals.filter((j) => j.detectedAspects.includes(aspect))
    const averageSentiment =
      aspectJournals.length > 0
        ? aspectJournals.reduce((sum, j) => sum + j.sentimentScore, 0) /
          aspectJournals.length
        : 0

    const goalProgress = await calculateAspectProgress(aspect)

    // Generate highlights and concerns
    const highlights: string[] = []
    const concerns: string[] = []

    if (taskCompletionRate > 80) highlights.push("Strong task completion")
    if (averageSentiment > 0.3) highlights.push("Positive sentiment trend")
    if (goalProgress > 50) highlights.push("Good goal progress")

    if (taskCompletionRate < 50) concerns.push("Task completion needs improvement")
    if (averageSentiment < -0.2) concerns.push("Some negative sentiment detected")
    if (goalProgress < 20) concerns.push("Goals falling behind")

    aspectSummaries[aspect] = {
      goalProgress,
      taskCompletionRate,
      averageSentiment: Number(averageSentiment.toFixed(2)),
      highlights,
      concerns,
    }
  }

  // Monthly goal progress
  const monthlyGoals = await db.monthlyGoals.where("month").equals(monthStr).toArray()
  const monthlyGoalProgress = await Promise.all(
    monthlyGoals.map(async (g) => ({
      goalId: g.id,
      title: g.title,
      progress: await calculateMonthlyProgress(g.id),
      status: g.status,
    }))
  )

  // Calculate trends (simplified - comparing to previous month would need more data)
  const trends: MonthlySummary["trends"] = []
  const overallCompletion =
    tasks.length > 0
      ? (tasks.filter((t) => t.status === "done").length / tasks.length) * 100
      : 0

  trends.push({
    metric: "Task Completion",
    direction: overallCompletion > 70 ? "up" : overallCompletion < 50 ? "down" : "stable",
    change: Math.round(overallCompletion),
  })

  return {
    month: monthStr,
    aspectSummaries,
    monthlyGoalProgress,
    trends,
  }
}

/**
 * Calculate training streak
 */
export async function getTrainingStreak(): Promise<number> {
  const sessions = await db.trainingSessions.orderBy("date").reverse().toArray()
  if (sessions.length === 0) return 0

  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  let streak = 0
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))

  // Check if there's a session today or yesterday to start the streak
  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
    return 0
  }

  let expectedDate = new Date()
  if (!uniqueDates.includes(today)) {
    expectedDate = new Date(Date.now() - 86400000)
  }

  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr)
    const expected = formatDate(expectedDate)

    if (dateStr === expected) {
      streak++
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculate cooking streak
 */
export async function getCookingStreak(): Promise<number> {
  const meals = await db.meals.orderBy("date").reverse().toArray()
  if (meals.length === 0) return 0

  const uniqueDates = [...new Set(meals.map((m) => m.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  let streak = 0

  for (const dateStr of uniqueDates) {
    const dateMeals = meals.filter((m) => m.date === dateStr)
    const allCooked = dateMeals.every((m) => m.cooked)

    if (allCooked && dateMeals.length > 0) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/**
 * Calculate journal streak
 */
export async function getJournalStreak(): Promise<number> {
  const entries = await db.journalEntries.orderBy("timestamp").reverse().toArray()
  if (entries.length === 0) return 0

  const uniqueDates = [...new Set(entries.map((e) => formatDate(new Date(e.timestamp))))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  let streak = 0
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))

  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
    return 0
  }

  let expectedDate = new Date()
  if (!uniqueDates.includes(today)) {
    expectedDate = new Date(Date.now() - 86400000)
  }

  for (const dateStr of uniqueDates) {
    const expected = formatDate(expectedDate)

    if (dateStr === expected) {
      streak++
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}
