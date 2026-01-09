/**
 * Layer 2: Smart Connections Service
 *
 * Uses Ollama LLM to suggest goal connections for unlinked items.
 * Falls back to rule-based matching when Ollama is unavailable.
 */

import { db, generateId } from "@/db"
import { checkOllamaConnection, generateWithOllama } from "@/services/ollama"
import type {
  SyncIssue,
  ConnectionSuggestion,
  LifeAspect,
  SyncEntityType,
} from "@/lib/types"

export interface SmartConnectionsResult {
  ran: boolean
  ollamaAvailable: boolean
  suggestionsGenerated: number
  issues: SyncIssue[]
}

interface UnlinkedItem {
  id: string
  type: SyncEntityType
  title: string
  aspect?: LifeAspect
  context?: string
}

interface GoalContext {
  id: string
  title: string
  aspect: LifeAspect
}

/**
 * Find all unlinked items that could benefit from goal connections
 */
async function getUnlinkedItems(): Promise<UnlinkedItem[]> {
  const items: UnlinkedItem[] = []

  // Tasks without weekly goals
  const tasks = await db.tasks.filter((t) => !t.weeklyGoalId).toArray()
  for (const task of tasks) {
    items.push({
      id: task.id,
      type: "task",
      title: task.title,
      aspect: task.aspect,
      context: task.notes,
    })
  }

  // Training sessions without linked goals
  const sessions = await db.trainingSessions
    .filter((s) => !s.linkedGoalId)
    .toArray()
  for (const session of sessions) {
    items.push({
      id: session.id,
      type: "training",
      title: `${session.type} training on ${session.date}`,
      aspect: "fitness",
      context: session.notes,
    })
  }

  // Meals without linked goals
  const meals = await db.meals.filter((m) => !m.linkedGoalId).toArray()
  for (const meal of meals) {
    items.push({
      id: meal.id,
      type: "meal",
      title: `${meal.type} on ${meal.date}`,
      aspect: "nutrition",
      context: meal.notes,
    })
  }

  return items
}

/**
 * Get active goals for matching
 */
async function getActiveGoals(): Promise<GoalContext[]> {
  const weeklyGoals = await db.weeklyGoals
    .filter((g) => g.status === "active")
    .toArray()

  return weeklyGoals.map((g) => ({
    id: g.id,
    title: g.title,
    aspect: g.aspect,
  }))
}

interface MatchResult {
  goalId: string
  goalTitle: string
  confidence: number
  reason: string
  method: "llm" | "rule-based"
}

/**
 * Rule-based matching (fallback when Ollama unavailable)
 */
function matchByRules(
  item: UnlinkedItem,
  goals: GoalContext[]
): MatchResult | null {
  // Filter by aspect first
  const aspectMatches = goals.filter((g) => g.aspect === item.aspect)
  if (aspectMatches.length === 0) return null

  // If only one match, suggest it
  if (aspectMatches.length === 1) {
    return {
      goalId: aspectMatches[0].id,
      goalTitle: aspectMatches[0].title,
      confidence: 0.6,
      reason: `Same aspect: ${item.aspect}`,
      method: "rule-based",
    }
  }

  // Try keyword matching
  const itemWords = item.title.toLowerCase().split(/\s+/)
  let bestMatch: GoalContext | null = null
  let bestScore = 0

  for (const goal of aspectMatches) {
    const goalWords = goal.title.toLowerCase().split(/\s+/)
    let score = 0

    for (const word of itemWords) {
      if (word.length > 3 && goalWords.some((gw) => gw.includes(word))) {
        score++
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = goal
    }
  }

  if (bestMatch && bestScore > 0) {
    return {
      goalId: bestMatch.id,
      goalTitle: bestMatch.title,
      confidence: Math.min(0.5 + bestScore * 0.1, 0.8),
      reason: `Keyword match in ${item.aspect}`,
      method: "rule-based",
    }
  }

  // Return first aspect match with low confidence
  return {
    goalId: aspectMatches[0].id,
    goalTitle: aspectMatches[0].title,
    confidence: 0.4,
    reason: `Only matching ${item.aspect} goal`,
    method: "rule-based",
  }
}

/**
 * LLM-based matching using Ollama
 */
async function matchWithOllama(
  item: UnlinkedItem,
  goals: GoalContext[]
): Promise<MatchResult | null> {
  if (goals.length === 0) return null

  const goalsText = goals
    .map((g, i) => `${i + 1}. "${g.title}" (${g.aspect})`)
    .join("\n")

  const prompt = `You are analyzing task-goal alignment for a personal productivity app.

Given this item:
- Type: ${item.type}
- Title: "${item.title}"
- Category: ${item.aspect || "unknown"}
${item.context ? `- Context: ${item.context}` : ""}

And these active goals:
${goalsText}

Which goal (if any) does this item most likely support? Consider:
1. Direct relevance (does completing this item directly advance the goal?)
2. Indirect support (does this item create conditions for goal progress?)
3. Category alignment (is the item in the same life area as the goal?)

Respond in JSON format:
{
  "goalNumber": <number 1-${goals.length} or null if no good match>,
  "confidence": <0.0-1.0>,
  "reason": "<brief explanation>"
}

If no goal is a reasonable match (confidence would be below 0.3), respond with goalNumber: null.`

  try {
    const response = await generateWithOllama(prompt, {
      timeout: 15000,
    })

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const result = JSON.parse(jsonMatch[0])

    if (!result.goalNumber || result.confidence < 0.3) return null

    const matchedGoal = goals[result.goalNumber - 1]
    if (!matchedGoal) return null

    return {
      goalId: matchedGoal.id,
      goalTitle: matchedGoal.title,
      confidence: result.confidence,
      reason: result.reason,
      method: "llm",
    }
  } catch (error) {
    console.warn("Ollama matching failed:", error)
    return null
  }
}

/**
 * Run smart connections analysis
 */
export async function runSmartConnections(): Promise<SmartConnectionsResult> {
  const unlinkedItems = await getUnlinkedItems()
  const activeGoals = await getActiveGoals()

  if (unlinkedItems.length === 0 || activeGoals.length === 0) {
    return {
      ran: true,
      ollamaAvailable: false,
      suggestionsGenerated: 0,
      issues: [],
    }
  }

  const ollamaAvailable = await checkOllamaConnection()
  const issues: SyncIssue[] = []

  // Process items (limit to prevent long sync times)
  const itemsToProcess = unlinkedItems.slice(0, 20)

  for (const item of itemsToProcess) {
    let match: MatchResult | null = null

    if (ollamaAvailable) {
      match = await matchWithOllama(item, activeGoals)
    }

    // Fall back to rule-based if Ollama failed or unavailable
    if (!match) {
      match = matchByRules(item, activeGoals)
    }

    if (match && match.confidence >= 0.4) {
      issues.push({
        id: generateId(),
        type: "unlinked_item",
        severity: "info",
        entityType: item.type,
        entityId: item.id,
        entityTitle: item.title,
        linkedEntityType: "weeklyGoal",
        suggestedGoalId: match.goalId,
        suggestedGoalTitle: match.goalTitle,
        description: `${item.type} "${item.title}" could be linked to a goal`,
        suggestion: match.reason,
        confidence: match.confidence,
        layer: 2,
        detectedAt: new Date(),
      })
    }
  }

  // Save new issues to database (avoid duplicates)
  if (issues.length > 0) {
    const existingIssues = await db.syncIssues
      .where("layer")
      .equals(2)
      .filter((i) => !i.resolvedAt)
      .toArray()

    const existingKeys = new Set(
      existingIssues.map((i) => `${i.entityType}:${i.entityId}`)
    )

    const newIssues = issues.filter(
      (i) => !existingKeys.has(`${i.entityType}:${i.entityId}`)
    )

    if (newIssues.length > 0) {
      await db.syncIssues.bulkAdd(newIssues)
    }
  }

  return {
    ran: true,
    ollamaAvailable,
    suggestionsGenerated: issues.length,
    issues,
  }
}

/**
 * Get connection suggestion for a single new item
 * Use this for real-time suggestions during item creation
 */
export async function suggestConnectionForItem(
  item: UnlinkedItem
): Promise<ConnectionSuggestion | null> {
  const activeGoals = await getActiveGoals()
  if (activeGoals.length === 0) return null

  const ollamaAvailable = await checkOllamaConnection()
  let match: MatchResult | null = null

  if (ollamaAvailable) {
    match = await matchWithOllama(item, activeGoals)
  }

  if (!match) {
    match = matchByRules(item, activeGoals)
  }

  if (!match) return null

  return {
    entityId: item.id,
    entityTitle: item.title,
    entityType: item.type,
    suggestedGoals: [
      {
        goalId: match.goalId,
        goalTitle: match.goalTitle,
        goalLevel: "weekly",
        confidence: match.confidence,
        reasoning: match.reason,
      },
    ],
    method: match.method,
  }
}
