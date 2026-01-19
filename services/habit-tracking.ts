import { db, formatDate } from "@/db"
import type {
  TrainingSession,
  Meal,
  LifeAspect,
  HabitGoal,
  ActivitySummary,
  HabitTrackingStats,
  HabitGoalProgress,
  CookingRatioStats,
  TrainingType,
  MealType,
} from "@/lib/types"
import { calculateStreak } from "./streaks"

/**
 * Habit Tracking Service
 *
 * Core insight: Goal progress = ONLY linked items
 *               Activity summary = ALL items
 *               Cooking ratio = ALL meals (always useful data)
 */

// ========== DATE HELPERS ==========

function getPeriodDates(period: "day" | "week" | "month"): { start: string; end: string } {
  const now = new Date()
  const today = formatDate(now)

  if (period === "day") {
    return { start: today, end: today }
  }

  if (period === "week") {
    // Week starts on Monday (consistent with app's weekStartsOn: 1 default)
    const weekStart = new Date(now)
    const dayOfWeek = now.getDay()
    // Convert Sunday=0 to 7 for Monday-based calculation
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    weekStart.setDate(now.getDate() - daysFromMonday)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return { start: formatDate(weekStart), end: formatDate(weekEnd) }
  }

  // month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: formatDate(monthStart), end: formatDate(monthEnd) }
}

function getTrainingTypeLabel(type: TrainingType): string {
  const labels: Record<TrainingType, string> = {
    "muay-thai": "Muay Thai",
    cardio: "Cardio",
    strength: "Strength",
    flexibility: "Flexibility",
    "dj-practice": "DJ Practice",
    other: "Training",
  }
  return labels[type] || "Training"
}

function getMealTypeLabel(type: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  }
  return labels[type] || "Meal"
}

// ========== GOAL PROGRESS (LINKED ITEMS ONLY) ==========

/**
 * Calculate training goal progress from linked sessions only
 */
export async function calculateTrainingGoalProgress(
  goalId: string,
  habit: HabitGoal
): Promise<HabitGoalProgress> {
  const { start, end } = getPeriodDates(habit.period)

  // Only count sessions linked to this goal
  const sessions = await db.trainingSessions
    .where("linkedGoalId")
    .equals(goalId)
    .filter((s) => s.date >= start && s.date <= end)
    .toArray()

  const current = sessions.length
  const target = habit.target
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  // Streak calculation - using "never miss twice" logic
  const allLinkedDates = (
    await db.trainingSessions.where("linkedGoalId").equals(goalId).toArray()
  ).map((s) => s.date)

  const streakData = calculateStreak(allLinkedDates)

  // Get goal title
  const goal = await db.yearlyGoals.get(goalId)

  return {
    goalId,
    goalTitle: goal?.title || "Untitled Goal",
    target,
    period: habit.period,
    current,
    percentage,
    linkedSessions: current,
    streak: streakData.current,
  }
}

/**
 * Calculate cooking goal progress from linked cooked meals only
 */
export async function calculateCookingGoalProgress(
  goalId: string,
  habit: HabitGoal
): Promise<HabitGoalProgress> {
  const { start, end } = getPeriodDates(habit.period)

  // Only count cooked meals linked to this goal
  const meals = await db.meals
    .where("linkedGoalId")
    .equals(goalId)
    .filter((m) => m.date >= start && m.date <= end && m.cooked)
    .toArray()

  const current = meals.length
  const target = habit.target
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0

  // Get goal title
  const goal = await db.yearlyGoals.get(goalId)

  return {
    goalId,
    goalTitle: goal?.title || "Untitled Goal",
    target,
    period: habit.period,
    current,
    percentage,
    linkedSessions: current,
    streak: habit.currentStreak || 0,
  }
}

// ========== COOKING RATIO (ALL MEALS) ==========

/**
 * Get cooking ratio stats - always tracks ALL meals regardless of goal linking
 * This is "nice to have" data that's always useful
 */
export async function getCookingRatioStats(): Promise<CookingRatioStats> {
  const allMeals = await db.meals.toArray()
  const { start: weekStart, end: weekEnd } = getPeriodDates("week")
  const { start: monthStart, end: monthEnd } = getPeriodDates("month")

  const calculateRatio = (meals: Meal[]) => {
    const cooked = meals.filter((m) => m.cooked).length
    const ordered = meals.filter((m) => !m.cooked).length
    const total = meals.length
    const ratio = total > 0 ? Math.round((cooked / total) * 100) : 0
    return { cooked, ordered, total, ratio }
  }

  return {
    allTime: calculateRatio(allMeals),
    thisWeek: calculateRatio(
      allMeals.filter((m) => m.date >= weekStart && m.date <= weekEnd)
    ),
    thisMonth: calculateRatio(
      allMeals.filter((m) => m.date >= monthStart && m.date <= monthEnd)
    ),
  }
}

// ========== ACTIVITY HISTORY (ALL ITEMS) ==========

/**
 * Get unified activity history for timeline view - includes ALL items
 * Both goal-linked and quick-logged activities appear here
 */
export async function getActivityHistory(
  limit = 50,
  offset = 0
): Promise<ActivitySummary[]> {
  const [sessions, meals] = await Promise.all([
    db.trainingSessions.orderBy("date").reverse().toArray(),
    db.meals.orderBy("date").reverse().toArray(),
  ])

  // Fetch goal titles for linked items
  const goalIds = [
    ...new Set([
      ...sessions.filter((s) => s.linkedGoalId).map((s) => s.linkedGoalId!),
      ...meals.filter((m) => m.linkedGoalId).map((m) => m.linkedGoalId!),
    ]),
  ]
  const goals = await db.yearlyGoals.where("id").anyOf(goalIds).toArray()
  const goalTitleMap = Object.fromEntries(goals.map((g) => [g.id, g.title]))

  const activities: ActivitySummary[] = [
    ...sessions.map((s) => ({
      id: s.id,
      type: "training" as const,
      date: s.date,
      title: `${getTrainingTypeLabel(s.type)} ${s.duration}min`,
      aspect: (s.type === "dj-practice" ? "side-projects" : "fitness") as LifeAspect,
      linkedGoalId: s.linkedGoalId,
      linkedGoalTitle: s.linkedGoalId ? goalTitleMap[s.linkedGoalId] : undefined,
      countsTowardGoal: !!s.linkedGoalId,
      metadata: {
        duration: s.duration,
        intensity: s.intensity,
        trainingType: s.type,
      },
      createdAt: s.createdAt,
    })),
    ...meals.map((m) => ({
      id: m.id,
      type: "meal" as const,
      date: m.date,
      title: `${getMealTypeLabel(m.type)} - ${m.description || "Meal"}`,
      aspect: "nutrition" as LifeAspect,
      linkedGoalId: m.linkedGoalId,
      linkedGoalTitle: m.linkedGoalId ? goalTitleMap[m.linkedGoalId] : undefined,
      countsTowardGoal: !!m.linkedGoalId,
      metadata: {
        cooked: m.cooked,
        mealType: m.type,
      },
      createdAt: m.createdAt,
    })),
  ]

  // Sort by date descending and paginate
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(offset, offset + limit)
}

// ========== COMBINED STATS FOR DASHBOARD ==========

/**
 * Get combined habit tracking stats for dashboard
 * Shows both goal progress (linked only) and activity summary (all items)
 */
export async function getHabitTrackingStats(): Promise<HabitTrackingStats> {
  // Get active habit goals
  const yearlyGoals = await db.yearlyGoals
    .filter((g) => g.goalType === "habit" && g.status === "active" && !!g.habit)
    .toArray()

  const goalProgress = await Promise.all(
    yearlyGoals.map(async (goal) => {
      const habit = goal.habit!
      const progress =
        goal.aspect === "fitness"
          ? await calculateTrainingGoalProgress(goal.id, habit)
          : await calculateCookingGoalProgress(goal.id, habit)

      return progress
    })
  )

  // Activity summary (all items)
  const [allSessions, allMeals] = await Promise.all([
    db.trainingSessions.toArray(),
    db.meals.toArray(),
  ])

  const linkedSessions =
    allSessions.filter((s) => s.linkedGoalId).length +
    allMeals.filter((m) => m.linkedGoalId).length
  const totalSessions = allSessions.length + allMeals.length

  const { start: weekStart, end: weekEnd } = getPeriodDates("week")
  const { start: monthStart, end: monthEnd } = getPeriodDates("month")

  const thisWeek =
    allSessions.filter((s) => s.date >= weekStart && s.date <= weekEnd).length +
    allMeals.filter((m) => m.date >= weekStart && m.date <= weekEnd).length
  const thisMonth =
    allSessions.filter((s) => s.date >= monthStart && s.date <= monthEnd).length +
    allMeals.filter((m) => m.date >= monthStart && m.date <= monthEnd).length

  return {
    goalProgress,
    activitySummary: {
      totalSessions,
      linkedSessions,
      unlinkedSessions: totalSessions - linkedSessions,
      thisWeek,
      thisMonth,
    },
  }
}

// ========== STREAK HELPERS ==========

/**
 * Get streak for goal-linked training sessions only
 */
export async function getGoalLinkedTrainingStreak(goalId: string) {
  const sessions = await db.trainingSessions
    .where("linkedGoalId")
    .equals(goalId)
    .toArray()
  const dates = sessions.map((s) => s.date)
  return calculateStreak(dates)
}

/**
 * Get streak for all training sessions (regardless of goal link)
 */
export async function getAllTrainingStreak() {
  const sessions = await db.trainingSessions.toArray()
  const dates = sessions.map((s) => s.date)
  return calculateStreak(dates)
}

/**
 * Get streak for cooking (all cooked meals)
 */
export async function getCookingStreak() {
  const meals = await db.meals.filter((m) => m.cooked).toArray()
  const dates = [...new Set(meals.map((m) => m.date))]
  return calculateStreak(dates)
}

// ========== STATS WITH DISTINCTION ==========

interface TrainingStatsResult {
  totalSessions: number
  totalMinutes: number
  avgIntensity: number
  thisWeekSessions: number
  thisWeekMinutes: number
}

/**
 * Get training stats with goal-linked vs unlinked distinction
 */
export async function getTrainingStatsWithDistinction(): Promise<{
  all: TrainingStatsResult
  goalLinked: TrainingStatsResult
  unlinked: TrainingStatsResult
}> {
  const allSessions = await db.trainingSessions.toArray()
  const linked = allSessions.filter((s) => s.linkedGoalId)
  const unlinked = allSessions.filter((s) => !s.linkedGoalId)

  const { start: weekStart, end: weekEnd } = getPeriodDates("week")

  const calculateStats = (sessions: TrainingSession[]): TrainingStatsResult => {
    const weekSessions = sessions.filter(
      (s) => s.date >= weekStart && s.date <= weekEnd
    )
    return {
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => sum + s.duration, 0),
      avgIntensity:
        sessions.length > 0
          ? Math.round(
              sessions.reduce((sum, s) => sum + s.intensity, 0) / sessions.length
            )
          : 0,
      thisWeekSessions: weekSessions.length,
      thisWeekMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
    }
  }

  return {
    all: calculateStats(allSessions),
    goalLinked: calculateStats(linked),
    unlinked: calculateStats(unlinked),
  }
}
