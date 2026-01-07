/**
 * Time Extractor
 *
 * Extracts time information from natural language text.
 * Supports explicit times (7pm, 19:00), and relative times (morning, evening).
 * Includes Malaysian/Malay language support.
 */

import type { TimePreference } from "@/lib/types"

export interface TimeExtractionResult {
  time: string // "19:00" format (24-hour)
  confidence: number
  matchedText: string
  timePreference: TimePreference
  isExplicit: boolean // true for "7pm", false for "evening"
}

// Time patterns
const TIME_PATTERNS = {
  // Explicit times
  twelveHour: /\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/i,
  twentyFourHour: /\b([01]?\d|2[0-3]):([0-5]\d)\b/,

  // Relative time references (English + Malay)
  relative: {
    morning: /\b(morning|pagi|pg|this\s+morning)\b/i,
    afternoon: /\b(afternoon|petang|ptg|tengahari|this\s+afternoon)\b/i,
    evening: /\b(evening|malam|mlm|this\s+evening)\b/i,
    night: /\b(night|tengah\s*malam|tonight)\b/i,
    lunch: /\b(lunch|lunchtime|tengahari)\b/i,
    afterWork: /\b(after\s*work|lepas\s*kerja|after\s*office)\b/i,
    beforeWork: /\b(before\s*work|sebelum\s*kerja)\b/i,
    earlyMorning: /\b(early\s*morning|subuh|awal\s*pagi)\b/i,
    lateMorning: /\b(late\s*morning)\b/i,
    lateEvening: /\b(late\s*evening|late\s*night)\b/i,
    noon: /\b(noon|midday|12\s*pm)\b/i,
    midnight: /\b(midnight|12\s*am)\b/i,
  },

  // Duration patterns (for extraction, not time)
  duration: {
    hours: /\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|jam)\b/i,
    minutes: /\b(\d+)\s*(minutes?|mins?|minit)\b/i,
  },
}

// Default times for relative references
const RELATIVE_TIME_DEFAULTS: Record<string, { time: string; preference: TimePreference }> = {
  earlyMorning: { time: "06:00", preference: "morning" },
  morning: { time: "09:00", preference: "morning" },
  lateMorning: { time: "11:00", preference: "morning" },
  noon: { time: "12:00", preference: "afternoon" },
  lunch: { time: "12:30", preference: "afternoon" },
  afternoon: { time: "14:00", preference: "afternoon" },
  afterWork: { time: "18:00", preference: "evening" },
  beforeWork: { time: "07:00", preference: "morning" },
  evening: { time: "19:00", preference: "evening" },
  night: { time: "21:00", preference: "evening" },
  lateEvening: { time: "22:00", preference: "evening" },
  midnight: { time: "00:00", preference: "evening" },
}

/**
 * Convert 12-hour format to 24-hour format
 */
function convertTo24Hour(hours: number, minutes: number, period: string): string {
  let h = hours
  const isPM = period.toLowerCase().startsWith("p")

  if (isPM && h !== 12) {
    h += 12
  } else if (!isPM && h === 12) {
    h = 0
  }

  return `${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

/**
 * Infer time preference from 24-hour time string
 */
function inferTimePreference(time: string): TimePreference {
  const hour = parseInt(time.split(":")[0])

  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 || hour < 5) return "evening"

  return "anytime"
}

/**
 * Extract time from text
 */
export function extractTime(text: string): TimeExtractionResult | null {
  const lowerText = text.toLowerCase()

  // 1. Try explicit 12-hour format (highest priority)
  const twelveMatch = text.match(TIME_PATTERNS.twelveHour)
  if (twelveMatch) {
    const hours = parseInt(twelveMatch[1])
    const minutes = parseInt(twelveMatch[2] || "0")
    const period = twelveMatch[3]

    // Validate hours
    if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes <= 59) {
      const time24 = convertTo24Hour(hours, minutes, period)
      return {
        time: time24,
        confidence: 0.95,
        matchedText: twelveMatch[0],
        timePreference: inferTimePreference(time24),
        isExplicit: true,
      }
    }
  }

  // 2. Try 24-hour format
  const twentyFourMatch = text.match(TIME_PATTERNS.twentyFourHour)
  if (twentyFourMatch) {
    const hours = parseInt(twentyFourMatch[1])
    const minutes = parseInt(twentyFourMatch[2])

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const time24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
      return {
        time: time24,
        confidence: 0.98,
        matchedText: twentyFourMatch[0],
        timePreference: inferTimePreference(time24),
        isExplicit: true,
      }
    }
  }

  // 3. Check relative time references (lower priority)
  // Check more specific patterns first
  const orderedPatterns = [
    "earlyMorning",
    "lateMorning",
    "lateEvening",
    "beforeWork",
    "afterWork",
    "midnight",
    "noon",
    "lunch",
    "morning",
    "afternoon",
    "evening",
    "night",
  ] as const

  for (const key of orderedPatterns) {
    const pattern = TIME_PATTERNS.relative[key as keyof typeof TIME_PATTERNS.relative]
    if (pattern && pattern.test(lowerText)) {
      const match = lowerText.match(pattern)
      const defaults = RELATIVE_TIME_DEFAULTS[key]
      if (defaults) {
        return {
          time: defaults.time,
          confidence: 0.70, // Lower confidence for relative times
          matchedText: match?.[0] || key,
          timePreference: defaults.preference,
          isExplicit: false,
        }
      }
    }
  }

  return null
}

/**
 * Extract duration from text
 */
export function extractDuration(text: string): {
  minutes: number
  confidence: number
  matchedText: string
} | null {
  // Check for hours
  const hoursMatch = text.match(TIME_PATTERNS.duration.hours)
  if (hoursMatch) {
    const hours = parseFloat(hoursMatch[1])
    return {
      minutes: Math.round(hours * 60),
      confidence: 0.95,
      matchedText: hoursMatch[0],
    }
  }

  // Check for minutes
  const minutesMatch = text.match(TIME_PATTERNS.duration.minutes)
  if (minutesMatch) {
    return {
      minutes: parseInt(minutesMatch[1]),
      confidence: 0.95,
      matchedText: minutesMatch[0],
    }
  }

  return null
}

/**
 * Infer time preference from text without extracting specific time
 */
export function inferTimePreferenceFromText(text: string): TimePreference | null {
  const lowerText = text.toLowerCase()

  // Check patterns in order
  if (TIME_PATTERNS.relative.morning.test(lowerText) ||
      TIME_PATTERNS.relative.earlyMorning.test(lowerText) ||
      TIME_PATTERNS.relative.beforeWork.test(lowerText)) {
    return "morning"
  }

  if (TIME_PATTERNS.relative.afternoon.test(lowerText) ||
      TIME_PATTERNS.relative.lunch.test(lowerText) ||
      TIME_PATTERNS.relative.noon.test(lowerText)) {
    return "afternoon"
  }

  if (TIME_PATTERNS.relative.evening.test(lowerText) ||
      TIME_PATTERNS.relative.night.test(lowerText) ||
      TIME_PATTERNS.relative.afterWork.test(lowerText) ||
      TIME_PATTERNS.relative.lateEvening.test(lowerText)) {
    return "evening"
  }

  return null
}
