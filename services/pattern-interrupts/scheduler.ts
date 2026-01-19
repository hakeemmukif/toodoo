import type { InterruptSchedule, PatternInterrupt } from "@/lib/types"
import { generateId, formatDate } from "@/db"
import { getRandomQuestions } from "./questions"

/**
 * Frequency to number of interrupts per day mapping.
 */
const FREQUENCY_COUNT: Record<InterruptSchedule["frequency"], number> = {
  low: 3,
  medium: 5,
  high: 8,
}

/**
 * Parse time string "HH:MM" to minutes since midnight.
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to Date object for today.
 */
function minutesToDate(minutes: number, baseDate: Date = new Date()): Date {
  const date = new Date(baseDate)
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return date
}

/**
 * Check if a time (in minutes) is within quiet hours.
 */
function isQuietHour(
  minutes: number,
  quietHours: InterruptSchedule["quietHours"]
): boolean {
  const start = parseTimeToMinutes(quietHours.start)
  const end = parseTimeToMinutes(quietHours.end)

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (start > end) {
    // Quiet if after start OR before end
    return minutes >= start || minutes < end
  }

  // Normal range (e.g., 13:00 - 14:00)
  return minutes >= start && minutes < end
}

/**
 * Get available time slots (in minutes) for a day.
 * Returns array of minute values excluding quiet hours.
 */
function getAvailableSlots(quietHours: InterruptSchedule["quietHours"]): number[] {
  const slots: number[] = []

  // Iterate through all minutes in a day
  for (let minute = 0; minute < 24 * 60; minute += 15) {
    // Use 15-min granularity
    if (!isQuietHour(minute, quietHours)) {
      slots.push(minute)
    }
  }

  return slots
}

/**
 * Distribute interrupts randomly across available time slots.
 * Maintains minimum 1 hour gap between interrupts.
 */
function distributeInterrupts(
  availableSlots: number[],
  count: number
): number[] {
  if (availableSlots.length === 0) return []
  if (count <= 0) return []

  const minGap = 60 // Minimum 1 hour between interrupts
  const selected: number[] = []

  // Shuffle slots for randomness
  const shuffled = [...availableSlots].sort(() => Math.random() - 0.5)

  for (const slot of shuffled) {
    if (selected.length >= count) break

    // Check minimum gap from existing selections
    const hasConflict = selected.some(
      (existing) => Math.abs(existing - slot) < minGap
    )

    if (!hasConflict) {
      selected.push(slot)
    }
  }

  // Sort by time
  return selected.sort((a, b) => a - b)
}

/**
 * Generate a daily schedule of pattern interrupts.
 * Returns PatternInterrupt objects ready to be stored.
 */
export function generateDailySchedule(
  schedule: InterruptSchedule,
  forDate: Date = new Date()
): PatternInterrupt[] {
  if (!schedule.enabled) return []

  const count = FREQUENCY_COUNT[schedule.frequency]
  const availableSlots = getAvailableSlots(schedule.quietHours)
  const selectedTimes = distributeInterrupts(availableSlots, count)
  const questions = getRandomQuestions(count)

  const now = new Date()
  const dateStr = formatDate(forDate)

  return selectedTimes.map((minutes, index) => {
    const scheduledFor = minutesToDate(minutes, forDate)

    return {
      id: generateId(),
      question: questions[index] || questions[0],
      scheduledFor,
      isRandom: true,
      skipped: false,
      createdAt: now,
      updatedAt: now,
    }
  })
}

/**
 * Check if we need to generate a new schedule for today.
 */
export function needsNewSchedule(
  schedule: InterruptSchedule,
  today: string = formatDate(new Date())
): boolean {
  if (!schedule.enabled) return false
  return schedule.lastScheduledDate !== today
}

/**
 * Get the next due interrupt from a list.
 * Returns null if none are due.
 */
export function getNextDueInterrupt(
  interrupts: PatternInterrupt[],
  now: Date = new Date()
): PatternInterrupt | null {
  const due = interrupts.find((interrupt) => {
    // Skip already responded or skipped
    if (interrupt.respondedAt || interrupt.skipped) return false

    // Check if scheduled time has passed
    return new Date(interrupt.scheduledFor) <= now
  })

  return due || null
}
