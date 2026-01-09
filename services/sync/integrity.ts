/**
 * Layer 1: Data Integrity Service
 *
 * Validates entity links and cleans up orphaned references.
 * No LLM required - pure database validation.
 */

import { db, generateId } from "@/db"
import type {
  SyncIssue,
  SyncIssueSeverity,
  SyncIssueType,
  SyncEntityType,
  Task,
  TrainingSession,
  Meal,
  JournalEntry,
  WeeklyGoal,
  MonthlyGoal,
  ScheduleBlock,
} from "@/lib/types"

export interface IntegrityCheckResult {
  ran: boolean
  issuesFound: number
  issuesFixed: number
  issues: SyncIssue[]
}

interface EntityWithGoalLink {
  id: string
  title?: string
  linkedGoalId?: string
  type: SyncEntityType
}

/**
 * Validate all task -> weeklyGoal links
 */
export async function validateTaskLinks(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  const tasks = await db.tasks.toArray()
  const weeklyGoalIds = new Set((await db.weeklyGoals.toArray()).map(g => g.id))

  for (const task of tasks) {
    // Check weeklyGoalId reference
    if (task.weeklyGoalId && !weeklyGoalIds.has(task.weeklyGoalId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "warning",
        entityType: "task",
        entityId: task.id,
        entityTitle: task.title,
        linkedEntityType: "weeklyGoal",
        linkedEntityId: task.weeklyGoalId,
        description: `Task "${task.title}" references deleted weekly goal`,
        suggestion: "Unlink from goal or link to active goal",
      }))
    }

    // Check parentTaskId for subtasks
    if (task.parentTaskId) {
      const parentExists = tasks.some(t => t.id === task.parentTaskId)
      if (!parentExists) {
        issues.push(createIssue({
          type: "orphaned_reference",
          severity: "warning",
          entityType: "task",
          entityId: task.id,
          entityTitle: task.title,
          linkedEntityType: "task",
          linkedEntityId: task.parentTaskId,
          description: `Subtask "${task.title}" references deleted parent task`,
          suggestion: "Convert to standalone task or delete",
        }))
      }
    }

    // Check recurrenceTemplateId
    if (task.recurrenceTemplateId) {
      const templateExists = await db.recurrenceTemplates.get(task.recurrenceTemplateId)
      if (!templateExists) {
        issues.push(createIssue({
          type: "orphaned_reference",
          severity: "info",
          entityType: "task",
          entityId: task.id,
          entityTitle: task.title,
          linkedEntityType: "recurrenceTemplate",
          linkedEntityId: task.recurrenceTemplateId,
          description: `Task "${task.title}" references deleted recurrence template`,
          suggestion: "Clear recurrence reference",
        }))
      }
    }
  }

  return issues
}

/**
 * Validate weekly goal -> monthly goal chain
 */
export async function validateGoalHierarchy(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []

  const weeklyGoals = await db.weeklyGoals.toArray()
  const monthlyGoals = await db.monthlyGoals.toArray()
  const yearlyGoals = await db.yearlyGoals.toArray()

  const monthlyGoalIds = new Set(monthlyGoals.map(g => g.id))
  const yearlyGoalIds = new Set(yearlyGoals.map(g => g.id))

  // Check weekly -> monthly links
  for (const weekly of weeklyGoals) {
    if (weekly.monthlyGoalId && !monthlyGoalIds.has(weekly.monthlyGoalId)) {
      issues.push(createIssue({
        type: "missing_parent",
        severity: "warning",
        entityType: "weeklyGoal",
        entityId: weekly.id,
        entityTitle: weekly.title,
        linkedEntityType: "monthlyGoal",
        linkedEntityId: weekly.monthlyGoalId,
        description: `Weekly goal "${weekly.title}" references deleted monthly goal`,
        suggestion: "Link to active monthly goal or convert to standalone",
      }))
    }
  }

  // Check monthly -> yearly links
  for (const monthly of monthlyGoals) {
    if (monthly.yearlyGoalId && !yearlyGoalIds.has(monthly.yearlyGoalId)) {
      issues.push(createIssue({
        type: "missing_parent",
        severity: "warning",
        entityType: "monthlyGoal",
        entityId: monthly.id,
        entityTitle: monthly.title,
        linkedEntityType: "yearlyGoal",
        linkedEntityId: monthly.yearlyGoalId,
        description: `Monthly goal "${monthly.title}" references deleted yearly goal`,
        suggestion: "Link to active yearly goal or convert to standalone",
      }))
    }
  }

  return issues
}

/**
 * Validate training session -> goal links
 */
export async function validateTrainingLinks(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  const sessions = await db.trainingSessions.toArray()
  const weeklyGoalIds = new Set((await db.weeklyGoals.toArray()).map(g => g.id))

  for (const session of sessions) {
    if (session.linkedGoalId && !weeklyGoalIds.has(session.linkedGoalId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "info",
        entityType: "training",
        entityId: session.id,
        entityTitle: `${session.type} on ${session.date}`,
        linkedEntityType: "weeklyGoal",
        linkedEntityId: session.linkedGoalId,
        description: `Training session references deleted goal`,
        suggestion: "Unlink or link to active fitness goal",
      }))
    }
  }

  return issues
}

/**
 * Validate meal -> goal links
 */
export async function validateMealLinks(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  const meals = await db.meals.toArray()
  const weeklyGoalIds = new Set((await db.weeklyGoals.toArray()).map(g => g.id))
  const recipeIds = new Set((await db.recipes.toArray()).map(r => r.id))

  for (const meal of meals) {
    if (meal.linkedGoalId && !weeklyGoalIds.has(meal.linkedGoalId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "info",
        entityType: "meal",
        entityId: meal.id,
        entityTitle: `${meal.type} on ${meal.date}`,
        linkedEntityType: "weeklyGoal",
        linkedEntityId: meal.linkedGoalId,
        description: `Meal references deleted goal`,
        suggestion: "Unlink or link to active nutrition goal",
      }))
    }

    if (meal.recipeId && !recipeIds.has(meal.recipeId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "info",
        entityType: "meal",
        entityId: meal.id,
        entityTitle: `${meal.type} on ${meal.date}`,
        linkedEntityType: "recipe",
        linkedEntityId: meal.recipeId,
        description: `Meal references deleted recipe`,
        suggestion: "Clear recipe reference",
      }))
    }
  }

  return issues
}

/**
 * Validate journal -> goal links
 */
export async function validateJournalLinks(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  const entries = await db.journalEntries.toArray()
  const weeklyGoalIds = new Set((await db.weeklyGoals.toArray()).map(g => g.id))

  for (const entry of entries) {
    if (entry.linkedGoalIds && entry.linkedGoalIds.length > 0) {
      for (const goalId of entry.linkedGoalIds) {
        if (!weeklyGoalIds.has(goalId)) {
          issues.push(createIssue({
            type: "orphaned_reference",
            severity: "info",
            entityType: "journal",
            entityId: entry.id,
            entityTitle: `Journal entry from ${new Date(entry.timestamp).toLocaleDateString()}`,
            linkedEntityType: "weeklyGoal",
            linkedEntityId: goalId,
            description: `Journal entry references deleted goal`,
            suggestion: "Remove invalid goal reference",
          }))
        }
      }
    }
  }

  return issues
}

/**
 * Validate schedule block -> task and goal links
 */
export async function validateScheduleBlockLinks(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  const blocks = await db.scheduleBlocks.toArray()
  const taskIds = new Set((await db.tasks.toArray()).map(t => t.id))
  const weeklyGoalIds = new Set((await db.weeklyGoals.toArray()).map(g => g.id))

  for (const block of blocks) {
    if (block.linkedTaskId && !taskIds.has(block.linkedTaskId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "warning",
        entityType: "scheduleBlock",
        entityId: block.id,
        entityTitle: block.title,
        linkedEntityType: "task",
        linkedEntityId: block.linkedTaskId,
        description: `Schedule block "${block.title}" references deleted task`,
        suggestion: "Unlink or link to active task",
      }))
    }

    if (block.linkedGoalId && !weeklyGoalIds.has(block.linkedGoalId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "info",
        entityType: "scheduleBlock",
        entityId: block.id,
        entityTitle: block.title,
        linkedEntityType: "weeklyGoal",
        linkedEntityId: block.linkedGoalId,
        description: `Schedule block "${block.title}" references deleted goal`,
        suggestion: "Unlink or link to active goal",
      }))
    }
  }

  return issues
}

/**
 * Validate shopping items -> list links
 */
export async function validateShoppingLinks(): Promise<SyncIssue[]> {
  const issues: SyncIssue[] = []
  const items = await db.shoppingItems.toArray()
  const listIds = new Set((await db.shoppingLists.toArray()).map(l => l.id))

  for (const item of items) {
    if (item.listId && !listIds.has(item.listId)) {
      issues.push(createIssue({
        type: "orphaned_reference",
        severity: "warning",
        entityType: "task", // Using task as closest entity type for shopping items
        entityId: item.id,
        entityTitle: item.item,
        linkedEntityType: "shoppingList",
        linkedEntityId: item.listId,
        description: `Shopping item "${item.item}" references deleted list`,
        suggestion: "Delete orphaned item or move to active list",
      }))
    }
  }

  return issues
}

/**
 * Auto-fix orphaned references by unlinking
 * Only fixes safe cases (info severity)
 */
export async function cleanupOrphanedReferences(
  issues: SyncIssue[],
  autoResolve: boolean = false
): Promise<number> {
  if (!autoResolve) return 0

  let fixed = 0

  for (const issue of issues) {
    if (issue.type !== "orphaned_reference") continue
    if (issue.severity === "critical") continue // Never auto-fix critical

    try {
      switch (issue.entityType) {
        case "task":
          if (issue.linkedEntityType === "weeklyGoal") {
            await db.tasks.update(issue.entityId, { weeklyGoalId: undefined })
            fixed++
          } else if (issue.linkedEntityType === "recurrenceTemplate") {
            await db.tasks.update(issue.entityId, { recurrenceTemplateId: undefined })
            fixed++
          }
          break

        case "training":
          await db.trainingSessions.update(issue.entityId, { linkedGoalId: undefined })
          fixed++
          break

        case "meal":
          if (issue.linkedEntityType === "weeklyGoal") {
            await db.meals.update(issue.entityId, { linkedGoalId: undefined })
            fixed++
          } else if (issue.linkedEntityType === "recipe") {
            await db.meals.update(issue.entityId, { recipeId: undefined })
            fixed++
          }
          break

        case "scheduleBlock":
          if (issue.linkedEntityType === "task") {
            await db.scheduleBlocks.update(issue.entityId, { linkedTaskId: undefined })
            fixed++
          } else if (issue.linkedEntityType === "weeklyGoal") {
            await db.scheduleBlocks.update(issue.entityId, { linkedGoalId: undefined })
            fixed++
          }
          break
      }

      // Mark issue as resolved
      await db.syncIssues.update(issue.id, {
        resolvedAt: new Date(),
        resolution: "unlinked",
      })
    } catch (error) {
      console.warn(`Failed to auto-fix issue ${issue.id}:`, error)
    }
  }

  return fixed
}

/**
 * Run full Layer 1 integrity check
 */
export async function runIntegrityCheck(
  options: { autoResolve?: boolean } = {}
): Promise<IntegrityCheckResult> {
  const { autoResolve = false } = options

  // Run all validation checks in parallel
  const [
    taskIssues,
    goalHierarchyIssues,
    trainingIssues,
    mealIssues,
    journalIssues,
    scheduleBlockIssues,
    shoppingIssues,
  ] = await Promise.all([
    validateTaskLinks(),
    validateGoalHierarchy(),
    validateTrainingLinks(),
    validateMealLinks(),
    validateJournalLinks(),
    validateScheduleBlockLinks(),
    validateShoppingLinks(),
  ])

  const allIssues = [
    ...taskIssues,
    ...goalHierarchyIssues,
    ...trainingIssues,
    ...mealIssues,
    ...journalIssues,
    ...scheduleBlockIssues,
    ...shoppingIssues,
  ]

  // Save new issues to database (avoid duplicates)
  const existingIssues = await db.syncIssues
    .filter((i) => !i.resolvedAt)
    .toArray()

  const existingKeys = new Set(
    existingIssues.map(i => `${i.entityType}:${i.entityId}:${i.linkedEntityId}`)
  )

  const newIssues = allIssues.filter(
    i => !existingKeys.has(`${i.entityType}:${i.entityId}:${i.linkedEntityId}`)
  )

  if (newIssues.length > 0) {
    await db.syncIssues.bulkAdd(newIssues)
  }

  // Auto-fix if enabled
  let issuesFixed = 0
  if (autoResolve && allIssues.length > 0) {
    issuesFixed = await cleanupOrphanedReferences(allIssues, true)
  }

  return {
    ran: true,
    issuesFound: allIssues.length,
    issuesFixed,
    issues: allIssues,
  }
}

/**
 * Resolve a specific issue manually
 */
export async function resolveIssue(
  issueId: string,
  resolution: "linked" | "unlinked" | "ignored" | "deleted",
  newLinkId?: string
): Promise<void> {
  const issue = await db.syncIssues.get(issueId)
  if (!issue) return

  // If linking to new entity, update the reference
  if (resolution === "linked" && newLinkId) {
    switch (issue.entityType) {
      case "task":
        if (issue.linkedEntityType === "weeklyGoal") {
          await db.tasks.update(issue.entityId, { weeklyGoalId: newLinkId })
        }
        break
      case "training":
        await db.trainingSessions.update(issue.entityId, { linkedGoalId: newLinkId })
        break
      case "meal":
        if (issue.linkedEntityType === "weeklyGoal") {
          await db.meals.update(issue.entityId, { linkedGoalId: newLinkId })
        }
        break
      case "scheduleBlock":
        if (issue.linkedEntityType === "weeklyGoal") {
          await db.scheduleBlocks.update(issue.entityId, { linkedGoalId: newLinkId })
        } else if (issue.linkedEntityType === "task") {
          await db.scheduleBlocks.update(issue.entityId, { linkedTaskId: newLinkId })
        }
        break
    }
  }

  // If unlinking, clear the reference
  if (resolution === "unlinked") {
    switch (issue.entityType) {
      case "task":
        if (issue.linkedEntityType === "weeklyGoal") {
          await db.tasks.update(issue.entityId, { weeklyGoalId: undefined })
        }
        break
      case "training":
        await db.trainingSessions.update(issue.entityId, { linkedGoalId: undefined })
        break
      case "meal":
        await db.meals.update(issue.entityId, { linkedGoalId: undefined })
        break
      case "scheduleBlock":
        if (issue.linkedEntityType === "weeklyGoal") {
          await db.scheduleBlocks.update(issue.entityId, { linkedGoalId: undefined })
        } else if (issue.linkedEntityType === "task") {
          await db.scheduleBlocks.update(issue.entityId, { linkedTaskId: undefined })
        }
        break
    }
  }

  // If deleting, remove the entity
  if (resolution === "deleted") {
    switch (issue.entityType) {
      case "task":
        await db.tasks.delete(issue.entityId)
        break
      case "training":
        await db.trainingSessions.delete(issue.entityId)
        break
      case "meal":
        await db.meals.delete(issue.entityId)
        break
      case "scheduleBlock":
        await db.scheduleBlocks.delete(issue.entityId)
        break
    }
  }

  // Mark issue as resolved
  await db.syncIssues.update(issueId, {
    resolvedAt: new Date(),
    resolution,
  })
}

/**
 * Get all unresolved issues
 */
export async function getUnresolvedIssues(): Promise<SyncIssue[]> {
  return db.syncIssues
    .filter(i => !i.resolvedAt)
    .toArray()
}

/**
 * Get issues by severity
 */
export async function getIssuesBySeverity(
  severity: SyncIssueSeverity
): Promise<SyncIssue[]> {
  return db.syncIssues
    .where("severity")
    .equals(severity)
    .filter(i => !i.resolvedAt)
    .toArray()
}

/**
 * Get issues for a specific entity
 */
export async function getIssuesForEntity(
  entityType: SyncEntityType,
  entityId: string
): Promise<SyncIssue[]> {
  return db.syncIssues
    .filter((i) => i.entityType === entityType && i.entityId === entityId && !i.resolvedAt)
    .toArray()
}

// Helper to create issue with defaults
function createIssue(params: {
  type: SyncIssueType
  severity: SyncIssueSeverity
  entityType: SyncEntityType
  entityId: string
  entityTitle: string
  linkedEntityType?: string
  linkedEntityId?: string
  description: string
  suggestion?: string
}): SyncIssue {
  return {
    id: generateId(),
    type: params.type,
    severity: params.severity,
    entityType: params.entityType,
    entityId: params.entityId,
    entityTitle: params.entityTitle,
    linkedEntityType: params.linkedEntityType as SyncIssue["linkedEntityType"],
    linkedEntityId: params.linkedEntityId,
    description: params.description,
    suggestion: params.suggestion,
    layer: 1,
    detectedAt: new Date(),
  }
}
