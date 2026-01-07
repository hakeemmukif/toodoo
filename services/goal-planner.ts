import { db, generateId, formatDate, getMonthString, getWeekString } from "@/db"
import { checkOllamaConnection, queryOllama } from "./ollama"
import type {
  LifeAspect,
  GoalPlanDraft,
  PlanningMessage,
  UserContext,
  MonthlyPlanItem,
  WeeklyPlanItem,
  TaskPlanItem,
  CommittedGoalPlan,
  YearlyGoal,
  MonthlyGoal,
  WeeklyGoal,
  Task,
} from "@/lib/types"

// ========== USER CONTEXT ==========

/**
 * Build user context from current app state for personalized prompts
 */
export async function buildUserContext(): Promise<UserContext> {
  const activeGoals = await db.yearlyGoals
    .where("status")
    .equals("active")
    .toArray()

  const now = new Date()

  return {
    location: "Malaysia",
    timezone: "Asia/Kuala_Lumpur",
    currentDate: now,
    interests: [
      "muay thai training",
      "DJing (French house, Nu Disco, DDJ-400)",
      "fintech software engineering",
      "cooking",
    ],
    workSchedule: {
      daysPerWeek: 5,
      hoursPerDay: 8,
      flexibility: "medium",
    },
    activeGoals: activeGoals.map((g) => ({
      aspect: g.aspect,
      title: g.title,
      priority: g.priority,
    })),
  }
}

// ========== OLLAMA PROMPT ENGINEERING ==========

/**
 * Build system prompt with user context for goal planning
 */
function buildSystemPrompt(context: UserContext): string {
  const { currentDate, location, interests, activeGoals } = context

  const endOfYear = new Date(currentDate.getFullYear(), 11, 31)
  const monthsRemaining = Math.ceil(
    (endOfYear.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )
  const weeksRemaining = Math.ceil(
    (endOfYear.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )

  const activeGoalsContext =
    activeGoals.length > 0
      ? `\n\nCurrent active goals:\n${activeGoals
          .map((g) => `- ${g.aspect}: ${g.title} (Priority ${g.priority})`)
          .join("\n")}`
      : ""

  return `You are a personal goal planning coach for a software engineer in ${location}.

USER PROFILE:
- Location: ${location}
- Interests: ${interests.join(", ")}
- Work: Fintech software engineer, Monday-Friday
${activeGoalsContext}

CURRENT DATE: ${formatDate(currentDate)}
TIME REMAINING: ${monthsRemaining} months (${weeksRemaining} weeks) until end of ${currentDate.getFullYear()}

YOUR ROLE:
1. Analyze the user's goal and create a realistic, actionable breakdown
2. Account for their work schedule, interests, and existing commitments
3. Suggest specific milestones, not vague aspirations
4. Be honest about time requirements and challenges
5. Use their interests for motivation (e.g., muay thai discipline, DJ practice rhythm)
6. Break down yearly -> monthly -> weekly -> daily tasks
7. Include minimum viable versions for tasks (the 10-minute version)

PRINCIPLES TO FOLLOW:
- Never skip twice: Build in flexibility for one miss
- 2-minute rule: Make starting ridiculously easy
- Identity-based: Frame as "become someone who..."
- Resistance awareness: Flag potentially hard tasks
- Deep focus: Estimate focus hours needed
- Hell yes or no: Only suggest if genuinely achievable

IMPORTANT: Return ONLY valid JSON, no markdown formatting or extra text.`
}

/**
 * Build the JSON schema instruction for consistent output
 */
function buildJsonSchemaInstruction(currentDate: Date): string {
  const year = currentDate.getFullYear()
  const currentMonth = getMonthString(currentDate)
  const currentWeek = getWeekString(currentDate)

  return `
OUTPUT FORMAT (strict JSON only):
{
  "yearlyGoal": {
    "title": "Clear, specific yearly goal",
    "description": "Detailed explanation",
    "successCriteria": "Measurable outcome",
    "identityStatement": "Become someone who..."
  },
  "analysis": "Your honest assessment of feasibility and approach",
  "suggestions": ["Specific tip 1", "Specific tip 2"],
  "warnings": ["Potential challenge 1", "Potential challenge 2"],
  "monthlyBreakdown": [
    {
      "month": "${currentMonth}",
      "title": "Month 1 milestone",
      "successCriteria": "What good looks like",
      "milestones": ["Concrete achievement 1", "Achievement 2"]
    }
  ],
  "weeklyBreakdown": [
    {
      "week": "${currentWeek}",
      "month": "${currentMonth}",
      "title": "Week focus",
      "focus": "Main priority this week",
      "estimatedHours": 5
    }
  ],
  "initialTasks": [
    {
      "week": "${currentWeek}",
      "title": "Specific actionable task",
      "description": "Why and how",
      "scheduledDate": "${formatDate(currentDate)}",
      "timePreference": "morning",
      "durationEstimate": 60,
      "minimumVersion": "The 10-minute version",
      "isHardThing": false,
      "reasoning": "Why this task now"
    }
  ]
}

Generate months from ${currentMonth} through ${year}-12.
Generate at least 4 weeks of weekly breakdown.
Generate 3-5 initial tasks for the first 2 weeks.
Be direct, realistic, and actionable. No fluff.`
}

// ========== CORE PLANNING FUNCTIONS ==========

/**
 * Analyze user's goal input and generate initial breakdown
 */
export async function analyzeGoalInput(
  userPrompt: string,
  aspect: LifeAspect,
  userContext: UserContext
): Promise<GoalPlanDraft> {
  const connected = await checkOllamaConnection()
  if (!connected) {
    throw new Error(
      "Ollama is not connected. Please ensure Ollama is running at localhost:11434"
    )
  }

  const systemPrompt = buildSystemPrompt(userContext)
  const jsonSchema = buildJsonSchemaInstruction(userContext.currentDate)

  const fullPrompt = `${systemPrompt}

GOAL AREA: ${aspect}

USER'S GOAL:
"${userPrompt}"

Analyze this goal and create a complete breakdown from now until end of year. Be specific, realistic, and actionable. Consider their work schedule and existing commitments.

${jsonSchema}`

  const response = await queryOllama(fullPrompt)

  // Parse JSON response - handle potential markdown wrapping
  let jsonStr = response
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  } else {
    // Try to find JSON object directly
    const objMatch = response.match(/\{[\s\S]*\}/)
    if (objMatch) {
      jsonStr = objMatch[0]
    }
  }

  let parsed: {
    yearlyGoal: GoalPlanDraft["yearlyGoal"]
    analysis: string
    suggestions: string[]
    warnings: string[]
    monthlyBreakdown: MonthlyPlanItem[]
    weeklyBreakdown: WeeklyPlanItem[]
    initialTasks: TaskPlanItem[]
  }

  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error("Failed to parse AI response. Please try again.")
  }

  const conversationHistory: PlanningMessage[] = [
    {
      role: "user",
      content: userPrompt,
      timestamp: new Date(),
    },
    {
      role: "assistant",
      content: `Generated plan for: ${parsed.yearlyGoal?.title || userPrompt}`,
      timestamp: new Date(),
    },
  ]

  const draft: GoalPlanDraft = {
    id: generateId(),
    userPrompt,
    aspect,
    yearlyGoal: parsed.yearlyGoal || {
      title: userPrompt,
      description: "",
      successCriteria: "",
    },
    monthlyBreakdown: parsed.monthlyBreakdown || [],
    weeklyBreakdown: parsed.weeklyBreakdown || [],
    initialTasks: parsed.initialTasks || [],
    analysis: parsed.analysis || "",
    suggestions: parsed.suggestions || [],
    warnings: parsed.warnings || [],
    conversationHistory,
    createdAt: new Date(),
    lastModifiedAt: new Date(),
  }

  return draft
}

/**
 * Refine existing plan based on user feedback
 */
export async function refinePlan(
  currentDraft: GoalPlanDraft,
  userFeedback: string,
  userContext: UserContext
): Promise<GoalPlanDraft> {
  const connected = await checkOllamaConnection()
  if (!connected) {
    throw new Error("Ollama is not connected")
  }

  const systemPrompt = buildSystemPrompt(userContext)
  const jsonSchema = buildJsonSchemaInstruction(userContext.currentDate)

  const currentPlanSummary = `
CURRENT PLAN:
Yearly Goal: ${currentDraft.yearlyGoal.title}
Success Criteria: ${currentDraft.yearlyGoal.successCriteria}
Monthly breakdown: ${currentDraft.monthlyBreakdown.length} months planned
Weekly breakdown: ${currentDraft.weeklyBreakdown.length} weeks planned
Initial tasks: ${currentDraft.initialTasks.length} tasks

Monthly milestones:
${currentDraft.monthlyBreakdown.map((m) => `- ${m.month}: ${m.title}`).join("\n")}

USER FEEDBACK:
"${userFeedback}"

Refine the plan based on the feedback. Maintain the same JSON structure. Be responsive to their specific concerns. Keep elements that weren't criticized.`

  const fullPrompt = `${systemPrompt}

${currentPlanSummary}

${jsonSchema}`

  const response = await queryOllama(fullPrompt)

  // Parse JSON response
  let jsonStr = response
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  } else {
    const objMatch = response.match(/\{[\s\S]*\}/)
    if (objMatch) {
      jsonStr = objMatch[0]
    }
  }

  let parsed: {
    yearlyGoal: GoalPlanDraft["yearlyGoal"]
    analysis: string
    suggestions: string[]
    warnings: string[]
    monthlyBreakdown: MonthlyPlanItem[]
    weeklyBreakdown: WeeklyPlanItem[]
    initialTasks: TaskPlanItem[]
  }

  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error("Failed to parse AI response. Please try again.")
  }

  const updatedConversation: PlanningMessage[] = [
    ...currentDraft.conversationHistory,
    {
      role: "user",
      content: userFeedback,
      timestamp: new Date(),
    },
    {
      role: "assistant",
      content: `Refined plan based on feedback`,
      timestamp: new Date(),
    },
  ]

  const refinedDraft: GoalPlanDraft = {
    ...currentDraft,
    yearlyGoal: parsed.yearlyGoal || currentDraft.yearlyGoal,
    monthlyBreakdown: parsed.monthlyBreakdown || currentDraft.monthlyBreakdown,
    weeklyBreakdown: parsed.weeklyBreakdown || currentDraft.weeklyBreakdown,
    initialTasks: parsed.initialTasks || currentDraft.initialTasks,
    analysis: parsed.analysis || currentDraft.analysis,
    suggestions: parsed.suggestions || currentDraft.suggestions,
    warnings: parsed.warnings || currentDraft.warnings,
    conversationHistory: updatedConversation,
    lastModifiedAt: new Date(),
  }

  return refinedDraft
}

/**
 * Commit draft plan to database - creates all goal and task entities
 */
export async function commitGoalPlan(
  draft: GoalPlanDraft,
  addYearlyGoal: (
    goal: Omit<YearlyGoal, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>,
  addMonthlyGoal: (
    goal: Omit<MonthlyGoal, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>,
  addWeeklyGoal: (
    goal: Omit<WeeklyGoal, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>,
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<string>
): Promise<CommittedGoalPlan> {
  const { yearlyGoal, monthlyBreakdown, weeklyBreakdown, initialTasks, aspect } =
    draft

  // Get current priority for new goals
  const existingGoals = await db.yearlyGoals
    .where("status")
    .equals("active")
    .toArray()
  const maxPriority = existingGoals.reduce((max, g) => Math.max(max, g.priority), 0)

  // 1. Create yearly goal
  const yearlyGoalId = await addYearlyGoal({
    aspect,
    year: new Date().getFullYear(),
    title: yearlyGoal.title,
    description: yearlyGoal.description,
    successCriteria: yearlyGoal.successCriteria,
    identityStatement: yearlyGoal.identityStatement,
    status: "active",
    priority: maxPriority + 1,
    isHellYes: true,
  })

  // 2. Create monthly goals
  const monthlyGoalIds: string[] = []
  const monthlyGoalMap = new Map<string, string>() // month -> goalId

  for (const [index, monthlyItem] of monthlyBreakdown.entries()) {
    const id = await addMonthlyGoal({
      yearlyGoalId,
      aspect,
      month: monthlyItem.month,
      title: monthlyItem.title,
      successCriteria: monthlyItem.successCriteria,
      status: "active",
      priority: index + 1,
    })
    monthlyGoalIds.push(id)
    monthlyGoalMap.set(monthlyItem.month, id)
  }

  // 3. Create weekly goals
  const weeklyGoalIds: string[] = []
  const weeklyGoalMap = new Map<string, string>() // week -> goalId

  for (const weeklyItem of weeklyBreakdown) {
    const monthlyGoalId = monthlyGoalMap.get(weeklyItem.month)

    const id = await addWeeklyGoal({
      monthlyGoalId,
      aspect,
      week: weeklyItem.week,
      title: weeklyItem.title,
      status: "active",
    })
    weeklyGoalIds.push(id)
    weeklyGoalMap.set(weeklyItem.week, id)
  }

  // 4. Create initial tasks
  const taskIds: string[] = []

  for (const taskItem of initialTasks) {
    const weeklyGoalId = weeklyGoalMap.get(taskItem.week)

    const id = await addTask({
      weeklyGoalId,
      aspect,
      title: taskItem.title,
      description: taskItem.description,
      scheduledDate: taskItem.scheduledDate,
      timePreference: taskItem.timePreference,
      durationEstimate: taskItem.durationEstimate,
      minimumVersion: taskItem.minimumVersion,
      isHardThing: taskItem.isHardThing,
      status: "pending",
      deferCount: 0,
    })
    taskIds.push(id)
  }

  return {
    yearlyGoalId,
    monthlyGoalIds,
    weeklyGoalIds,
    taskIds,
  }
}

/**
 * Validate draft plan for common issues before committing
 */
export function validatePlan(
  draft: GoalPlanDraft
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!draft.yearlyGoal.title || draft.yearlyGoal.title.trim().length === 0) {
    errors.push("Yearly goal title is required")
  }

  if (
    !draft.yearlyGoal.successCriteria ||
    draft.yearlyGoal.successCriteria.trim().length === 0
  ) {
    errors.push("Success criteria is required")
  }

  if (draft.monthlyBreakdown.length === 0) {
    errors.push("At least one monthly milestone is required")
  }

  if (draft.weeklyBreakdown.length === 0) {
    errors.push("At least one weekly goal is required")
  }

  if (draft.initialTasks.length === 0) {
    errors.push("At least one initial task is required")
  }

  // Check date consistency
  const now = new Date()
  const endOfYear = new Date(now.getFullYear(), 11, 31)

  for (const task of draft.initialTasks) {
    const taskDate = new Date(task.scheduledDate)
    if (taskDate > endOfYear) {
      errors.push(`Task "${task.title}" has date beyond end of year`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Generate weeks between two dates
 */
export function generateWeeksInRange(startDate: Date, endDate: Date): string[] {
  const weeks: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    weeks.push(getWeekString(current))
    current.setDate(current.getDate() + 7)
  }

  return [...new Set(weeks)] // Remove duplicates
}

/**
 * Generate months between two dates
 */
export function generateMonthsInRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    months.push(getMonthString(current))
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

/**
 * Estimate total time commitment from plan
 */
export function estimateTimeCommitment(draft: GoalPlanDraft): {
  totalHours: number
  weeklyAverage: number
  dailyAverage: number
} {
  const totalMinutes = draft.initialTasks.reduce(
    (sum, task) => sum + (task.durationEstimate || 0),
    0
  )

  const totalHours = totalMinutes / 60
  const weeksCount = draft.weeklyBreakdown.length || 1
  const weeklyAverage = totalHours / weeksCount
  const dailyAverage = weeklyAverage / 7

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    weeklyAverage: Math.round(weeklyAverage * 10) / 10,
    dailyAverage: Math.round(dailyAverage * 10) / 10,
  }
}

/**
 * Save planning draft for later recovery
 */
export async function savePlanningDraft(draft: GoalPlanDraft): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // Expire in 7 days

  await db.planningDrafts.put({
    id: draft.id,
    aspect: draft.aspect,
    draft,
    expiresAt,
    createdAt: draft.createdAt,
    lastModifiedAt: draft.lastModifiedAt,
  })
}

/**
 * Load saved planning draft
 */
export async function loadPlanningDraft(
  id: string
): Promise<GoalPlanDraft | null> {
  const saved = await db.planningDrafts.get(id)
  if (!saved) return null

  // Check if expired
  if (new Date() > saved.expiresAt) {
    await db.planningDrafts.delete(id)
    return null
  }

  return saved.draft
}

/**
 * Get most recent planning draft for an aspect
 */
export async function getRecentDraft(
  aspect: LifeAspect
): Promise<GoalPlanDraft | null> {
  const drafts = await db.planningDrafts
    .where("aspect")
    .equals(aspect)
    .reverse()
    .sortBy("lastModifiedAt")

  const validDrafts = drafts.filter((d) => new Date() <= d.expiresAt)

  return validDrafts[0]?.draft || null
}

/**
 * Delete planning draft
 */
export async function deletePlanningDraft(id: string): Promise<void> {
  await db.planningDrafts.delete(id)
}

/**
 * Clean up expired drafts
 */
export async function cleanupExpiredDrafts(): Promise<number> {
  const now = new Date()
  const expired = await db.planningDrafts
    .filter((d) => d.expiresAt < now)
    .toArray()

  for (const draft of expired) {
    await db.planningDrafts.delete(draft.id)
  }

  return expired.length
}
