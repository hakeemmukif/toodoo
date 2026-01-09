/**
 * Layer 3: Coherence Audit Service
 *
 * Uses Ollama LLM to verify task-goal alignment and detect goal drift.
 * Analyzes whether linked tasks actually help achieve their goals.
 */

import { db, generateId } from "@/db"
import { checkOllamaConnection, generateWithOllama } from "@/services/ollama"
import type {
  SyncIssue,
  CoherenceAnalysis,
  Task,
  WeeklyGoal,
  MonthlyGoal,
  YearlyGoal,
} from "@/lib/types"

export interface CoherenceResult {
  ran: boolean
  ollamaAvailable: boolean
  coherenceIssues: number
  issues: SyncIssue[]
}

interface TaskWithGoal {
  task: Task
  weeklyGoal: WeeklyGoal
  monthlyGoal?: MonthlyGoal
  yearlyGoal?: YearlyGoal
}

/**
 * Get tasks with their goal hierarchy for analysis
 */
async function getTasksWithGoals(): Promise<TaskWithGoal[]> {
  const tasks = await db.tasks
    .filter((t) => !!t.weeklyGoalId && t.status !== "done")
    .toArray()

  const weeklyGoals = await db.weeklyGoals.toArray()
  const monthlyGoals = await db.monthlyGoals.toArray()
  const yearlyGoals = await db.yearlyGoals.toArray()

  const weeklyMap = new Map(weeklyGoals.map((g) => [g.id, g]))
  const monthlyMap = new Map(monthlyGoals.map((g) => [g.id, g]))
  const yearlyMap = new Map(yearlyGoals.map((g) => [g.id, g]))

  const result: TaskWithGoal[] = []

  for (const task of tasks) {
    const weeklyGoal = weeklyMap.get(task.weeklyGoalId!)
    if (!weeklyGoal) continue

    const monthlyGoal = weeklyGoal.monthlyGoalId
      ? monthlyMap.get(weeklyGoal.monthlyGoalId)
      : undefined

    const yearlyGoal = monthlyGoal?.yearlyGoalId
      ? yearlyMap.get(monthlyGoal.yearlyGoalId)
      : undefined

    result.push({ task, weeklyGoal, monthlyGoal, yearlyGoal })
  }

  return result
}

interface AnalysisResult {
  isAligned: boolean
  alignmentScore: number
  reasoning: string
  suggestions: string[]
}

/**
 * Analyze task-goal coherence using Ollama
 */
async function analyzeTaskCoherence(
  item: TaskWithGoal
): Promise<AnalysisResult | null> {
  const { task, weeklyGoal, monthlyGoal, yearlyGoal } = item

  const prompt = `You are a productivity coach analyzing task-goal alignment.

Task: "${task.title}"
${task.notes ? `Task notes: ${task.notes}` : ""}
${task.aspect ? `Life area: ${task.aspect}` : ""}

Goal Hierarchy:
- Weekly Goal: "${weeklyGoal.title}"
${monthlyGoal ? `- Monthly Goal: "${monthlyGoal.title}"` : ""}
${yearlyGoal ? `- Yearly Goal: "${yearlyGoal.title}"` : ""}

Analyze whether completing this task would meaningfully contribute to achieving the weekly goal.

Consider:
1. Direct Contribution: Does the task directly advance the goal?
2. Indirect Support: Does it create conditions for goal progress?
3. Alignment: Is the task in the spirit of what the goal is trying to achieve?
4. Drift Risk: Could this task be a distraction from the actual goal?

Respond in JSON format:
{
  "isAligned": <true/false>,
  "alignmentScore": <0.0-1.0>,
  "reasoning": "<brief explanation of alignment or misalignment>",
  "suggestions": ["<improvement suggestion 1>", "<improvement suggestion 2>"]
}

Be honest but constructive. A task doesn't need to be perfectly aligned, but flag clear misalignments.`

  try {
    const response = await generateWithOllama(prompt, {
      timeout: 20000,
    })

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const result = JSON.parse(jsonMatch[0])

    return {
      isAligned: result.isAligned,
      alignmentScore: result.alignmentScore,
      reasoning: result.reasoning,
      suggestions: result.suggestions || [],
    }
  } catch (error) {
    console.warn("Coherence analysis failed:", error)
    return null
  }
}

/**
 * Run coherence audit on linked tasks
 */
export async function runCoherenceAudit(): Promise<CoherenceResult> {
  const ollamaAvailable = await checkOllamaConnection()

  if (!ollamaAvailable) {
    return {
      ran: true,
      ollamaAvailable: false,
      coherenceIssues: 0,
      issues: [],
    }
  }

  const tasksWithGoals = await getTasksWithGoals()

  if (tasksWithGoals.length === 0) {
    return {
      ran: true,
      ollamaAvailable: true,
      coherenceIssues: 0,
      issues: [],
    }
  }

  const issues: SyncIssue[] = []

  // Limit analysis to prevent long sync times
  // Prioritize: recently created tasks, high-defer-count tasks
  const sorted = [...tasksWithGoals].sort((a, b) => {
    // High defer count first (might indicate resistance/misalignment)
    if (a.task.deferCount !== b.task.deferCount) {
      return (b.task.deferCount || 0) - (a.task.deferCount || 0)
    }
    // Then by creation date (newer first)
    return (
      new Date(b.task.createdAt || 0).getTime() -
      new Date(a.task.createdAt || 0).getTime()
    )
  })

  const itemsToAnalyze = sorted.slice(0, 10)

  for (const item of itemsToAnalyze) {
    const analysis = await analyzeTaskCoherence(item)

    if (!analysis) continue

    // Only create issues for misaligned tasks
    if (!analysis.isAligned || analysis.alignmentScore < 0.4) {
      const severity = analysis.alignmentScore < 0.3 ? "warning" : "info"

      issues.push({
        id: generateId(),
        type: "misaligned_task",
        severity,
        entityType: "task",
        entityId: item.task.id,
        entityTitle: item.task.title,
        linkedEntityType: "weeklyGoal",
        linkedEntityId: item.weeklyGoal.id,
        description: `Task may not effectively support goal "${item.weeklyGoal.title}"`,
        suggestion: analysis.reasoning,
        confidence: 1 - analysis.alignmentScore,
        layer: 3,
        detectedAt: new Date(),
      })
    }
  }

  // Save new issues to database (avoid duplicates)
  if (issues.length > 0) {
    const existingIssues = await db.syncIssues
      .where("layer")
      .equals(3)
      .filter((i) => !i.resolvedAt)
      .toArray()

    const existingKeys = new Set(
      existingIssues.map((i) => `${i.entityType}:${i.entityId}:${i.linkedEntityId}`)
    )

    const newIssues = issues.filter(
      (i) =>
        !existingKeys.has(`${i.entityType}:${i.entityId}:${i.linkedEntityId}`)
    )

    if (newIssues.length > 0) {
      await db.syncIssues.bulkAdd(newIssues)
    }
  }

  return {
    ran: true,
    ollamaAvailable: true,
    coherenceIssues: issues.length,
    issues,
  }
}

/**
 * Analyze coherence for a single task (for real-time feedback)
 */
export async function analyzeTaskCoherenceRealtime(
  taskId: string
): Promise<CoherenceAnalysis | null> {
  const ollamaAvailable = await checkOllamaConnection()
  if (!ollamaAvailable) return null

  const task = await db.tasks.get(taskId)
  if (!task || !task.weeklyGoalId) return null

  const weeklyGoal = await db.weeklyGoals.get(task.weeklyGoalId)
  if (!weeklyGoal) return null

  const monthlyGoal = weeklyGoal.monthlyGoalId
    ? await db.monthlyGoals.get(weeklyGoal.monthlyGoalId)
    : undefined

  const yearlyGoal = monthlyGoal?.yearlyGoalId
    ? await db.yearlyGoals.get(monthlyGoal.yearlyGoalId)
    : undefined

  const analysis = await analyzeTaskCoherence({
    task,
    weeklyGoal,
    monthlyGoal,
    yearlyGoal,
  })

  if (!analysis) return null

  return {
    taskId: task.id,
    taskTitle: task.title,
    linkedGoalId: weeklyGoal.id,
    linkedGoalTitle: weeklyGoal.title,
    isAligned: analysis.isAligned,
    alignmentScore: analysis.alignmentScore,
    reasoning: analysis.reasoning,
    suggestions: analysis.suggestions,
  }
}

/**
 * Get coach feedback for a misaligned task
 */
export async function getCoherenceFeedback(
  taskId: string,
  coachTone: "gentle" | "balanced" | "intense" = "balanced"
): Promise<string | null> {
  const analysis = await analyzeTaskCoherenceRealtime(taskId)
  if (!analysis) return null

  if (analysis.isAligned) {
    return null // No feedback needed for aligned tasks
  }

  const task = await db.tasks.get(taskId)
  if (!task) return null

  const tonePrompts = {
    gentle:
      "Be encouraging and supportive, framing any concerns as gentle suggestions.",
    balanced:
      "Be direct but constructive, balancing honesty with encouragement.",
    intense:
      "Be straightforward and challenging, pushing for clarity and focus.",
  }

  const prompt = `You are a productivity coach giving brief feedback on task alignment.

Task: "${task.title}"
Analysis: ${analysis.reasoning}

${tonePrompts[coachTone]}

Write 1-2 sentences of feedback for the user about this task's alignment with their goal.
Be specific and actionable. Don't explain what coherence means - just give the feedback.`

  try {
    const response = await generateWithOllama(prompt, {
      timeout: 10000,
    })

    return response.trim()
  } catch (error) {
    console.warn("Failed to generate coherence feedback:", error)
    return analysis.reasoning
  }
}
