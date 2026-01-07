/**
 * Date Utilities for Goal Matching
 *
 * Helper functions for week calculations and date comparisons.
 */

/**
 * Get ISO week number for a date
 * Week 1 is the week containing January 4th (ISO 8601)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday (current date + 4 - current day number)
  // Make Sunday day 7
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate week number
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Get start of week (Monday) for a date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust to Monday (0 = Sunday, so we need to go back 6 days; 1 = Monday, go back 0 days)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of week (Sunday) for a date
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date)
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Format a date as ISO week string "YYYY-Www"
 */
export function formatWeekString(date: Date): string {
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, "0")}`
}

/**
 * Parse an ISO week string "YYYY-Www" to get the start date
 */
export function parseWeekString(weekStr: string): Date | null {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const week = parseInt(match[2], 10)

  // January 4 is always in week 1
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // Make Sunday = 7

  // Find Monday of week 1
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setDate(jan4.getDate() - dayOfWeek + 1)

  // Add weeks to get to target week
  const targetMonday = new Date(mondayWeek1)
  targetMonday.setDate(mondayWeek1.getDate() + (week - 1) * 7)

  return targetMonday
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: Date, date2: Date): boolean {
  return formatWeekString(date1) === formatWeekString(date2)
}

/**
 * Check if two dates are in the same month
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  )
}

/**
 * Get current week string in Malaysia timezone
 */
export function getCurrentWeekString(): string {
  const now = new Date()
  // Adjust for Malaysia timezone (UTC+8)
  const malaysiaOffset = 8 * 60 // minutes
  const localOffset = now.getTimezoneOffset()
  const malaysiaTime = new Date(now.getTime() + (malaysiaOffset + localOffset) * 60000)
  return formatWeekString(malaysiaTime)
}

/**
 * Get current month string "YYYY-MM"
 */
export function getCurrentMonthString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  return `${year}-${month}`
}
