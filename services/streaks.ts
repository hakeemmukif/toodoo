import type { StreakData } from "@/lib/types"
import { db, formatDate } from "@/db"

/**
 * Calculate streak data from activity dates
 * Key insight: Single miss is fine. Double miss breaks momentum.
 */
export function calculateStreak(dates: string[]): Omit<StreakData, "type"> {
  if (dates.length === 0) {
    return {
      current: 0,
      longest: 0,
      daysSinceDoubleMiss: 0,
    }
  }

  // Sort dates descending (newest first)
  const uniqueDates = [...new Set(dates)].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const today = new Date()
  const todayStr = formatDate(today)
  const yesterdayStr = formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000))

  // Calculate current streak
  let current = 0
  let lastActivityDate: string | undefined
  let lastMissDate: string | undefined

  // Check if there's activity today or yesterday to start streak
  const hasToday = uniqueDates[0] === todayStr
  const hasYesterday = uniqueDates[0] === yesterdayStr || uniqueDates[1] === yesterdayStr

  if (hasToday || hasYesterday) {
    // Walk backwards counting consecutive days
    let checkDate = hasToday ? today : new Date(today.getTime() - 24 * 60 * 60 * 1000)
    let dateIndex = 0

    while (dateIndex < uniqueDates.length) {
      const checkDateStr = formatDate(checkDate)
      const prevDateStr = formatDate(new Date(checkDate.getTime() - 24 * 60 * 60 * 1000))

      if (uniqueDates[dateIndex] === checkDateStr) {
        current++
        lastActivityDate = checkDateStr
        dateIndex++
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else if (uniqueDates[dateIndex] === prevDateStr) {
        // One miss - that's ok, continue
        lastMissDate = checkDateStr
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
      } else {
        // Double miss - streak broken
        break
      }
    }
  }

  // Calculate longest streak
  let longest = 0
  let currentLongest = 0
  let prevDate: Date | null = null

  for (const dateStr of [...uniqueDates].reverse()) {
    const date = new Date(dateStr)

    if (prevDate === null) {
      currentLongest = 1
    } else {
      const diffDays = Math.floor((date.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000))

      if (diffDays === 1) {
        // Consecutive day
        currentLongest++
      } else if (diffDays === 2) {
        // One day gap - allowed
        currentLongest++
      } else {
        // Gap too big - reset
        longest = Math.max(longest, currentLongest)
        currentLongest = 1
      }
    }

    prevDate = date
  }
  longest = Math.max(longest, currentLongest, current)

  // Calculate days since double miss
  // Find the last time there were 2+ consecutive days without activity
  let daysSinceDoubleMiss = 0
  let consecutiveMisses = 0
  let checkingDate = new Date(today)

  for (let i = 0; i < 365; i++) {
    const checkStr = formatDate(checkingDate)
    if (uniqueDates.includes(checkStr)) {
      consecutiveMisses = 0
    } else {
      consecutiveMisses++
      if (consecutiveMisses >= 2) {
        daysSinceDoubleMiss = i - 1 // The day before the double miss started
        break
      }
    }
    checkingDate = new Date(checkingDate.getTime() - 24 * 60 * 60 * 1000)

    // If we haven't found a double miss, increment the counter
    if (i === 364 && consecutiveMisses < 2) {
      daysSinceDoubleMiss = 365
    }
  }

  return {
    current,
    longest,
    lastActivityDate,
    lastMissDate,
    daysSinceDoubleMiss,
  }
}

/**
 * Update streak data in database
 */
export async function updateStreakData(
  type: StreakData["type"],
  dates: string[]
): Promise<StreakData> {
  const calculated = calculateStreak(dates)
  const streakData: StreakData = { type, ...calculated }

  await db.streakData.put(streakData)
  return streakData
}

/**
 * Get streak display message
 */
export function getStreakMessage(
  streak: StreakData,
  coachTone: "gentle" | "balanced" | "intense" = "balanced"
): string {
  const { current, daysSinceDoubleMiss, lastMissDate } = streak

  if (current === 0) {
    const messages = {
      gentle: "Let's start fresh today",
      balanced: "Start a new streak today",
      intense: "Day zero. Time to build.",
    }
    return messages[coachTone]
  }

  if (current >= 30) {
    const messages = {
      gentle: `Amazing! ${current} days strong`,
      balanced: `${current} days. Solid habit.`,
      intense: `${current} days. Don't stop.`,
    }
    return messages[coachTone]
  }

  if (lastMissDate) {
    const messages = {
      gentle: `${current} days going. One skip is fine, just keep going.`,
      balanced: `${current} days. One skip is fine, don't skip twice.`,
      intense: `${current} days. You slipped once. Don't slip again.`,
    }
    return messages[coachTone]
  }

  if (daysSinceDoubleMiss > 30) {
    const messages = {
      gentle: `${current} days strong! ${daysSinceDoubleMiss} days since any slip-up.`,
      balanced: `${current} days. ${daysSinceDoubleMiss} days since double-miss.`,
      intense: `${current} days. Momentum is ${daysSinceDoubleMiss} days deep.`,
    }
    return messages[coachTone]
  }

  return `${current} days`
}

/**
 * Get streak color based on status
 */
export function getStreakColor(current: number, daysSinceDoubleMiss: number): string {
  if (current === 0) return "oklch(0.5 0 0)" // gray
  if (current >= 30 || daysSinceDoubleMiss >= 30) return "oklch(0.56 0.1 25)" // terracotta - strong
  if (current >= 7) return "oklch(0.65 0.09 85)" // warm gold - building
  return "oklch(0.58 0.08 145)" // sage - starting
}

/**
 * Check if today breaks a streak (no activity yet and would be day 2 of missing)
 */
export function isStreakAtRisk(streak: StreakData): boolean {
  if (!streak.lastActivityDate) return false

  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))

  // If last activity was yesterday, we're still good
  if (streak.lastActivityDate === yesterday) return false

  // If last activity was today, we're good
  if (streak.lastActivityDate === today) return false

  // If last activity was 2+ days ago, streak might be at risk
  const lastActivity = new Date(streak.lastActivityDate)
  const daysSince = Math.floor((Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000))

  return daysSince >= 2
}
