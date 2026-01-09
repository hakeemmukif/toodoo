import type { Task, LifeAspect, ResistanceAnalysis, YearlyGoal } from "@/lib/types"

// Group tasks by a key function
function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(item)
    return acc
  }, {} as Record<K, T[]>)
}

// Get day of week name from date string
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return days[date.getDay()]
}

/**
 * Analyze tasks for resistance patterns
 * Resistance = tasks that have been deferred 2+ times
 */
export function analyzeResistance(tasks: Task[]): ResistanceAnalysis {
  const highResistanceTasks = tasks.filter((t) => t.deferCount >= 2)
  const patterns: string[] = []
  const suggestions: string[] = []

  if (highResistanceTasks.length === 0) {
    return { highResistanceTasks: [], patterns: [], suggestions: [] }
  }

  // Pattern: Group by aspect
  const byAspect = groupBy(highResistanceTasks, (t) => t.aspect)
  for (const [aspect, aspectTasks] of Object.entries(byAspect)) {
    if (aspectTasks.length >= 3) {
      patterns.push(`You consistently avoid ${aspect} tasks`)
      suggestions.push(`Break ${aspect} tasks into smaller, 10-minute versions`)
    }
  }

  // Pattern: Group by day of week
  const byDay = groupBy(highResistanceTasks, (t) => getDayOfWeek(t.scheduledDate))
  for (const [day, dayTasks] of Object.entries(byDay)) {
    if (dayTasks.length >= 2) {
      patterns.push(`${day}s seem to be avoidance days`)
      suggestions.push(`Consider lighter scheduling on ${day}s`)
    }
  }

  // Pattern: Group by time preference
  const byTime = groupBy(highResistanceTasks, (t) => t.timePreference)
  for (const [time, timeTasks] of Object.entries(byTime)) {
    if (timeTasks.length >= 3) {
      patterns.push(`${time} tasks are frequently avoided`)
      suggestions.push(`Try scheduling important tasks at a different time`)
    }
  }

  // Pattern: Tasks without minimum version
  const noFallback = highResistanceTasks.filter((t) => !t.minimumVersion)
  if (noFallback.length >= 2) {
    patterns.push(`${noFallback.length} avoided tasks have no fallback version`)
    suggestions.push(`Add a "minimum version" to make starting easier`)
  }

  // Pattern: Hard things being avoided
  const hardThingsAvoided = highResistanceTasks.filter((t) => t.isHardThing)
  if (hardThingsAvoided.length >= 1) {
    patterns.push(`You're avoiding the hard things`)
    suggestions.push(`Face one hard thing today, even for just 10 minutes`)
  }

  return {
    highResistanceTasks,
    patterns,
    suggestions,
  }
}

/**
 * Get resistance level for a single task
 */
export function getResistanceLevel(task: Task): "none" | "low" | "medium" | "high" {
  if (task.deferCount === 0) return "none"
  if (task.deferCount === 1) return "low"
  if (task.deferCount === 2) return "medium"
  return "high"
}

/**
 * Get resistance message based on defer count
 */
export function getResistanceMessage(
  deferCount: number,
  coachTone: "gentle" | "balanced" | "intense" = "balanced"
): string | null {
  if (deferCount < 2) return null

  const messages = {
    gentle: {
      2: "You've skipped this a couple times. What's making it difficult?",
      3: "This keeps getting pushed back. Maybe it needs to be smaller?",
      4: "Consider: is this still important, or should it be removed?",
    },
    balanced: {
      2: "Deferred twice. What's the resistance here?",
      3: "Skipped 3 times. Time to face this or drop it.",
      4: "This task is fighting you. What's really going on?",
    },
    intense: {
      2: "Deferred again. Name the resistance.",
      3: "3 times avoided. Do it now or delete it.",
      4: "You've been running from this. Stop. Face it.",
    },
  }

  const count = Math.min(deferCount, 4) as 2 | 3 | 4
  return messages[coachTone][count]
}

/**
 * Get aspect resistance summary
 */
export function getAspectResistanceSummary(
  tasks: Task[]
): Record<LifeAspect, { total: number; highResistance: number }> {
  const summary: Record<LifeAspect, { total: number; highResistance: number }> = {
    fitness: { total: 0, highResistance: 0 },
    nutrition: { total: 0, highResistance: 0 },
    career: { total: 0, highResistance: 0 },
    financial: { total: 0, highResistance: 0 },
    "side-projects": { total: 0, highResistance: 0 },
    chores: { total: 0, highResistance: 0 },
  }

  for (const task of tasks) {
    summary[task.aspect].total++
    if (task.deferCount >= 2) {
      summary[task.aspect].highResistance++
    }
  }

  return summary
}

/**
 * Get resistance color for UI
 */
export function getResistanceColor(level: "none" | "low" | "medium" | "high"): string {
  switch (level) {
    case "high":
      return "oklch(0.5 0.15 25)" // terracotta red
    case "medium":
      return "oklch(0.6 0.12 60)" // amber
    case "low":
      return "oklch(0.65 0.09 85)" // warm gold
    default:
      return "oklch(0.58 0.08 145)" // sage
  }
}

/**
 * Get WOOP-based intervention for high resistance
 * When a task has been deferred 3+ times, suggest reviewing WOOP plan
 */
export function getWOOPIntervention(
  task: Task,
  linkedGoal?: YearlyGoal
): { type: "review_plan" | "identify_obstacle" | "new_plan"; message: string } | null {
  if (task.deferCount < 3) return null

  // If goal has WOOP data, prompt to review it
  if (linkedGoal?.woop) {
    return {
      type: "review_plan",
      message: `You've avoided this ${task.deferCount} times. Remember your plan: "${linkedGoal.woop.plan || "Review your if-then plan"}"`,
    }
  }

  // If goal has if-then plans, surface them
  if (linkedGoal?.ifThenPlans && linkedGoal.ifThenPlans.length > 0) {
    return {
      type: "review_plan",
      message: linkedGoal.ifThenPlans[0],
    }
  }

  // If no WOOP, suggest identifying the obstacle
  return {
    type: "identify_obstacle",
    message: "What's the obstacle? Name it, then plan around it.",
  }
}

/**
 * Check if habit streak needs protection ("never miss twice")
 */
export function checkStreakProtection(
  goal: YearlyGoal,
  missedYesterday: boolean
): { shouldWarn: boolean; message: string } | null {
  if (goal.goalType !== "habit" || !goal.habit) return null

  // If missed yesterday and current streak was active, show protection message
  if (missedYesterday && goal.habit.longestStreak > 0) {
    return {
      shouldWarn: true,
      message: "One skip is fine. Don't skip twice. Get back on track today.",
    }
  }

  // If on a good streak, encourage continuation
  if (goal.habit.currentStreak >= 7) {
    return {
      shouldWarn: false,
      message: `${goal.habit.currentStreak} days strong. Keep the momentum.`,
    }
  }

  return null
}

/**
 * Get identity reinforcement message
 * Surfaces identity statements at key moments
 */
export function getIdentityReinforcement(
  goal: YearlyGoal,
  context: "task_start" | "task_complete" | "resistance" | "daily"
): string | null {
  if (!goal.identityStatement) return null

  const statement = goal.identityStatement

  switch (context) {
    case "task_start":
      return `You're someone who ${statement}. Let's go.`
    case "task_complete":
      return `That's what someone who ${statement} does.`
    case "resistance":
      return `Remember: You're becoming someone who ${statement}.`
    case "daily":
      return `Today's identity: Someone who ${statement}.`
    default:
      return null
  }
}

/**
 * Analyze behavioral patterns and generate nudges
 */
export function generateBehavioralNudges(
  tasks: Task[],
  goals: YearlyGoal[]
): { type: string; message: string; priority: "high" | "medium" | "low" }[] {
  const nudges: { type: string; message: string; priority: "high" | "medium" | "low" }[] = []

  // High resistance tasks
  const highResistance = tasks.filter((t) => t.deferCount >= 3 && t.status === "pending")
  if (highResistance.length > 0) {
    nudges.push({
      type: "resistance",
      message: `${highResistance.length} task${highResistance.length > 1 ? "s" : ""} with high resistance. Face one today.`,
      priority: "high",
    })
  }

  // Habit goals needing attention
  const habitGoals = goals.filter((g) => g.goalType === "habit" && g.habit)
  for (const goal of habitGoals) {
    if (goal.habit!.currentStreak === 0 && goal.habit!.longestStreak > 3) {
      nudges.push({
        type: "streak_broken",
        message: `Your ${goal.title} streak broke. Restart today to rebuild.`,
        priority: "medium",
      })
    }
  }

  // Identity reminders for active goals
  const goalsWithIdentity = goals.filter((g) => g.identityStatement && g.status === "active")
  if (goalsWithIdentity.length > 0) {
    const randomGoal = goalsWithIdentity[Math.floor(Math.random() * goalsWithIdentity.length)]
    nudges.push({
      type: "identity",
      message: `Today: Be someone who ${randomGoal.identityStatement}.`,
      priority: "low",
    })
  }

  return nudges.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
