/**
 * Date Extractor
 *
 * Extracts date information from natural language text.
 * Supports relative dates (today, tomorrow), weekdays, and absolute dates.
 * Includes Malaysian/Malay language support.
 */

import { getMalaysianDate, formatMalaysianDate } from "../malaysian-context"

export interface DateExtractionResult {
  date: string // ISO date string "2026-01-07"
  confidence: number
  matchedText: string
  isRelative: boolean
}

// Date patterns
const DATE_PATTERNS = {
  // Relative dates (English + Malay)
  relative: {
    today: /\b(today|tonight|hari\s*ini|hr\s*ini)\b/i,
    tomorrow: /\b(tomorrow|tmr|tmrw|esok)\b/i,
    yesterday: /\b(yesterday|semalam|kelmarin)\b/i,
    dayAfterTomorrow: /\b(day\s*after\s*tomorrow|lusa)\b/i,
  },

  // This week references
  thisWeek: /\b(this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun))\b/i,
  nextWeek: /\b(next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|week))\b/i,

  // Weekday patterns (English + Malay)
  weekday: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|isnin|selasa|rabu|khamis|jumaat|sabtu|ahad)\b/i,

  // Absolute dates
  dayMonth: /\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  monthDay: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{1,2})\b/i,
  slashDate: /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/,
}

// Weekday mappings
const WEEKDAY_MAP: Record<string, number> = {
  // English
  "sunday": 0, "sun": 0,
  "monday": 1, "mon": 1,
  "tuesday": 2, "tue": 2,
  "wednesday": 3, "wed": 3,
  "thursday": 4, "thu": 4,
  "friday": 5, "fri": 5,
  "saturday": 6, "sat": 6,
  // Malay
  "ahad": 0,
  "isnin": 1,
  "selasa": 2,
  "rabu": 3,
  "khamis": 4,
  "jumaat": 5,
  "sabtu": 6,
}

// Month mappings
const MONTH_MAP: Record<string, number> = {
  "jan": 0, "january": 0,
  "feb": 1, "february": 1,
  "mar": 2, "march": 2,
  "apr": 3, "april": 3,
  "may": 4,
  "jun": 5, "june": 5,
  "jul": 6, "july": 6,
  "aug": 7, "august": 7,
  "sep": 8, "september": 8,
  "oct": 9, "october": 9,
  "nov": 10, "november": 10,
  "dec": 11, "december": 11,
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get next occurrence of a weekday
 */
function getNextWeekday(weekday: number, reference: Date, forceNextWeek: boolean = false): Date {
  const result = new Date(reference)
  const currentDay = result.getDay()

  let daysToAdd = weekday - currentDay
  if (daysToAdd <= 0 || forceNextWeek) {
    daysToAdd += 7
  }

  result.setDate(result.getDate() + daysToAdd)
  return result
}

/**
 * Get this week's occurrence of a weekday
 */
function getThisWeekday(weekday: number, reference: Date): Date {
  const result = new Date(reference)
  const currentDay = result.getDay()
  const daysToAdd = weekday - currentDay

  result.setDate(result.getDate() + daysToAdd)
  return result
}

/**
 * Extract date from text
 */
export function extractDate(
  text: string,
  referenceDate?: Date
): DateExtractionResult | null {
  const ref = referenceDate || getMalaysianDate()
  const lowerText = text.toLowerCase()

  // 1. Check relative dates first (highest priority)

  // Today
  if (DATE_PATTERNS.relative.today.test(lowerText)) {
    const match = lowerText.match(DATE_PATTERNS.relative.today)
    return {
      date: formatMalaysianDate(ref),
      confidence: 0.98,
      matchedText: match?.[0] || "today",
      isRelative: true,
    }
  }

  // Tomorrow
  if (DATE_PATTERNS.relative.tomorrow.test(lowerText)) {
    const match = lowerText.match(DATE_PATTERNS.relative.tomorrow)
    const tomorrow = addDays(ref, 1)
    return {
      date: formatMalaysianDate(tomorrow),
      confidence: 0.98,
      matchedText: match?.[0] || "tomorrow",
      isRelative: true,
    }
  }

  // Yesterday
  if (DATE_PATTERNS.relative.yesterday.test(lowerText)) {
    const match = lowerText.match(DATE_PATTERNS.relative.yesterday)
    const yesterday = addDays(ref, -1)
    return {
      date: formatMalaysianDate(yesterday),
      confidence: 0.95,
      matchedText: match?.[0] || "yesterday",
      isRelative: true,
    }
  }

  // Day after tomorrow
  if (DATE_PATTERNS.relative.dayAfterTomorrow.test(lowerText)) {
    const match = lowerText.match(DATE_PATTERNS.relative.dayAfterTomorrow)
    const dayAfter = addDays(ref, 2)
    return {
      date: formatMalaysianDate(dayAfter),
      confidence: 0.95,
      matchedText: match?.[0] || "day after tomorrow",
      isRelative: true,
    }
  }

  // 2. Check "this [weekday]"
  const thisWeekMatch = lowerText.match(DATE_PATTERNS.thisWeek)
  if (thisWeekMatch) {
    const weekdayStr = thisWeekMatch[2].toLowerCase()
    const weekday = WEEKDAY_MAP[weekdayStr]
    if (weekday !== undefined) {
      const targetDate = getThisWeekday(weekday, ref)
      return {
        date: formatMalaysianDate(targetDate),
        confidence: 0.90,
        matchedText: thisWeekMatch[0],
        isRelative: true,
      }
    }
  }

  // 3. Check "next [weekday]" or "next week"
  const nextWeekMatch = lowerText.match(DATE_PATTERNS.nextWeek)
  if (nextWeekMatch) {
    const part = nextWeekMatch[2].toLowerCase()
    if (part === "week") {
      // "next week" - same day next week
      const nextWeek = addDays(ref, 7)
      return {
        date: formatMalaysianDate(nextWeek),
        confidence: 0.85,
        matchedText: nextWeekMatch[0],
        isRelative: true,
      }
    }
    const weekday = WEEKDAY_MAP[part]
    if (weekday !== undefined) {
      const targetDate = getNextWeekday(weekday, ref, true)
      return {
        date: formatMalaysianDate(targetDate),
        confidence: 0.90,
        matchedText: nextWeekMatch[0],
        isRelative: true,
      }
    }
  }

  // 4. Check absolute dates

  // "15 jan" or "15 january"
  const dayMonthMatch = text.match(DATE_PATTERNS.dayMonth)
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1])
    const month = MONTH_MAP[dayMonthMatch[2].toLowerCase()]
    if (month !== undefined && day >= 1 && day <= 31) {
      let year = ref.getFullYear()
      // If the date has passed this year, assume next year
      const targetDate = new Date(year, month, day)
      if (targetDate < ref) {
        year++
      }
      return {
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        confidence: 0.95,
        matchedText: dayMonthMatch[0],
        isRelative: false,
      }
    }
  }

  // "jan 15" or "january 15"
  const monthDayMatch = text.match(DATE_PATTERNS.monthDay)
  if (monthDayMatch) {
    const month = MONTH_MAP[monthDayMatch[1].toLowerCase()]
    const day = parseInt(monthDayMatch[2])
    if (month !== undefined && day >= 1 && day <= 31) {
      let year = ref.getFullYear()
      const targetDate = new Date(year, month, day)
      if (targetDate < ref) {
        year++
      }
      return {
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        confidence: 0.95,
        matchedText: monthDayMatch[0],
        isRelative: false,
      }
    }
  }

  // "15/1" or "15-01" or "15/1/2026"
  const slashMatch = text.match(DATE_PATTERNS.slashDate)
  if (slashMatch) {
    const part1 = parseInt(slashMatch[1])
    const part2 = parseInt(slashMatch[2])
    const part3 = slashMatch[3] ? parseInt(slashMatch[3]) : null

    // Assume DD/MM format (Malaysian convention)
    let day = part1
    let month = part2 - 1
    let year = part3 ? (part3 < 100 ? 2000 + part3 : part3) : ref.getFullYear()

    // Validate
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      // If no year specified and date has passed, assume next year
      if (!part3) {
        const targetDate = new Date(year, month, day)
        if (targetDate < ref) {
          year++
        }
      }
      return {
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        confidence: part3 ? 0.95 : 0.85, // Higher confidence with year
        matchedText: slashMatch[0],
        isRelative: false,
      }
    }
  }

  // 5. Check standalone weekday (lowest priority - could mean this week or next)
  const weekdayMatch = lowerText.match(DATE_PATTERNS.weekday)
  if (weekdayMatch) {
    const weekdayStr = weekdayMatch[1].toLowerCase()
    const weekday = WEEKDAY_MAP[weekdayStr]
    if (weekday !== undefined) {
      // Get next occurrence (could be today if it's that day)
      const targetDate = getNextWeekday(weekday, ref, false)
      return {
        date: formatMalaysianDate(targetDate),
        confidence: 0.75, // Lower confidence - ambiguous
        matchedText: weekdayMatch[0],
        isRelative: true,
      }
    }
  }

  return null
}
