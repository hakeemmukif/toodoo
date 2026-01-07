/**
 * Conflict Detector
 *
 * Detects time conflicts between proposed tasks and existing schedule.
 * Returns conflicts and suggests alternative times.
 */

import type { Task, TimeConflict, ConflictCheckResult } from "@/lib/types"
import { db } from "@/db"

// Configuration
const ADJACENT_THRESHOLD_MINUTES = 15 // Consider tasks within 15min as adjacent (soft warning)
const TIME_SLOT_INCREMENT = 30 // Suggest times in 30-min increments
const DAY_START_HOUR = 6 // First suggestion slot (6am)
const DAY_END_HOUR = 22 // Last suggestion slot (10pm)

/**
 * Check for time conflicts on a given date and time
 */
export async function checkTimeConflict(
  date: string, // "2026-01-07"
  time: string, // "19:00"
  duration: number, // minutes
  excludeTaskId?: string // For editing existing task
): Promise<ConflictCheckResult> {
  // 1. Get all tasks for the date with hardScheduledTime
  const tasksOnDate = await db.tasks
    .where("scheduledDate")
    .equals(date)
    .toArray()

  const scheduledTasks = tasksOnDate.filter(
    (t) =>
      t.hardScheduledTime &&
      t.status !== "done" &&
      t.status !== "skipped" &&
      t.id !== excludeTaskId
  )

  // 2. Calculate proposed task time range
  const proposedStart = timeToMinutes(time)
  const proposedEnd = proposedStart + duration

  // 3. Find conflicts
  const conflicts: TimeConflict[] = []

  for (const task of scheduledTasks) {
    const taskStart = timeToMinutes(task.hardScheduledTime!)
    const taskEnd = taskStart + (task.durationEstimate || 60)

    const conflictType = detectConflictType(
      proposedStart,
      proposedEnd,
      taskStart,
      taskEnd
    )

    if (conflictType) {
      conflicts.push({
        conflictingTaskId: task.id,
        conflictingTaskTitle: task.title,
        conflictType,
        conflictStart: task.hardScheduledTime!,
        conflictEnd: minutesToTime(taskEnd),
        suggestedAlternatives: [],
      })
    }
  }

  // 4. Generate alternative time suggestions
  const suggestedTimes = generateAlternativeTimes(
    scheduledTasks,
    duration,
    proposedStart
  )

  // Add top suggestions to each conflict
  conflicts.forEach((c) => {
    c.suggestedAlternatives = suggestedTimes.slice(0, 3)
  })

  // Only count exact and overlap as hard conflicts (block)
  // Adjacent is a soft warning
  const hardConflicts = conflicts.filter(
    (c) => c.conflictType === "exact" || c.conflictType === "overlap"
  )

  return {
    hasConflict: hardConflicts.length > 0,
    conflicts,
    suggestedTimes,
  }
}

/**
 * Detect conflict type between two time ranges
 */
function detectConflictType(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): "exact" | "overlap" | "adjacent" | null {
  // Exact match - same start time
  if (start1 === start2) return "exact"

  // Overlap: one range intersects with another
  if (start1 < end2 && end1 > start2) return "overlap"

  // Adjacent: within threshold (soft warning only)
  if (
    Math.abs(start1 - end2) <= ADJACENT_THRESHOLD_MINUTES ||
    Math.abs(end1 - start2) <= ADJACENT_THRESHOLD_MINUTES
  ) {
    return "adjacent"
  }

  return null
}

/**
 * Generate alternative time suggestions
 */
function generateAlternativeTimes(
  existingTasks: Task[],
  duration: number,
  preferredStart: number
): string[] {
  const busyRanges = existingTasks.map((t) => ({
    start: timeToMinutes(t.hardScheduledTime!),
    end: timeToMinutes(t.hardScheduledTime!) + (t.durationEstimate || 60),
  }))

  const suggestions: string[] = []

  // Try slots from DAY_START to DAY_END
  const dayStartMinutes = DAY_START_HOUR * 60
  const dayEndMinutes = DAY_END_HOUR * 60

  for (
    let slot = dayStartMinutes;
    slot <= dayEndMinutes - duration;
    slot += TIME_SLOT_INCREMENT
  ) {
    const slotEnd = slot + duration

    const isFree = !busyRanges.some(
      (range) => slot < range.end && slotEnd > range.start
    )

    if (isFree) {
      suggestions.push(minutesToTime(slot))
    }
  }

  // Sort by proximity to preferred time
  suggestions.sort((a, b) => {
    const aDiff = Math.abs(timeToMinutes(a) - preferredStart)
    const bDiff = Math.abs(timeToMinutes(b) - preferredStart)
    return aDiff - bDiff
  })

  return suggestions.slice(0, 6)
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Format time for display (12-hour format)
 */
export function formatTime12hr(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "pm" : "am"
  const displayHours = hours % 12 || 12
  return minutes > 0
    ? `${displayHours}:${String(minutes).padStart(2, "0")}${period}`
    : `${displayHours}${period}`
}
