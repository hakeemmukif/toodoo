/**
 * Malaysian Context Handler
 *
 * Provides location database, abbreviation expansion, and timezone handling
 * for Malaysian users. Includes gyms, areas, malls, and common abbreviations.
 */

import type { LocationType } from "@/lib/types"

// Malaysian location database
interface LocationInfo {
  fullName: string
  area: string
  type: LocationType
}

export const MALAYSIAN_LOCATIONS: Record<string, LocationInfo> = {
  // Gyms
  "bunker": { fullName: "The Bunker", area: "Kota Damansara", type: "gym" },
  "the bunker": { fullName: "The Bunker", area: "Kota Damansara", type: "gym" },
  "celebrity": { fullName: "Celebrity Fitness", area: "Various", type: "gym" },
  "celebrity fitness": { fullName: "Celebrity Fitness", area: "Various", type: "gym" },
  "ff": { fullName: "Fitness First", area: "Various", type: "gym" },
  "fitness first": { fullName: "Fitness First", area: "Various", type: "gym" },
  "ff 24": { fullName: "Fitness First 24", area: "Various", type: "gym" },
  "anytime": { fullName: "Anytime Fitness", area: "Various", type: "gym" },
  "anytime fitness": { fullName: "Anytime Fitness", area: "Various", type: "gym" },
  "chi fitness": { fullName: "Chi Fitness", area: "Various", type: "gym" },
  "true fitness": { fullName: "True Fitness", area: "Various", type: "gym" },

  // Areas/Abbreviations
  "kd": { fullName: "Kota Damansara", area: "Selangor", type: "other" },
  "kota damansara": { fullName: "Kota Damansara", area: "Selangor", type: "other" },
  "pj": { fullName: "Petaling Jaya", area: "Selangor", type: "other" },
  "petaling jaya": { fullName: "Petaling Jaya", area: "Selangor", type: "other" },
  "kl": { fullName: "Kuala Lumpur", area: "Kuala Lumpur", type: "other" },
  "kuala lumpur": { fullName: "Kuala Lumpur", area: "Kuala Lumpur", type: "other" },
  "ttdi": { fullName: "Taman Tun Dr Ismail", area: "Kuala Lumpur", type: "other" },
  "bangsar": { fullName: "Bangsar", area: "Kuala Lumpur", type: "other" },
  "mont kiara": { fullName: "Mont Kiara", area: "Kuala Lumpur", type: "other" },
  "mk": { fullName: "Mont Kiara", area: "Kuala Lumpur", type: "other" },
  "damansara heights": { fullName: "Damansara Heights", area: "Kuala Lumpur", type: "other" },
  "dh": { fullName: "Damansara Heights", area: "Kuala Lumpur", type: "other" },
  "sunway": { fullName: "Sunway", area: "Selangor", type: "other" },
  "subang": { fullName: "Subang Jaya", area: "Selangor", type: "other" },
  "subang jaya": { fullName: "Subang Jaya", area: "Selangor", type: "other" },
  "ss2": { fullName: "SS2", area: "Petaling Jaya", type: "other" },
  "ss15": { fullName: "SS15", area: "Subang Jaya", type: "other" },
  "usj": { fullName: "USJ", area: "Subang Jaya", type: "other" },
  "cheras": { fullName: "Cheras", area: "Kuala Lumpur", type: "other" },
  "ampang": { fullName: "Ampang", area: "Selangor", type: "other" },
  "cyberjaya": { fullName: "Cyberjaya", area: "Selangor", type: "other" },
  "putrajaya": { fullName: "Putrajaya", area: "Putrajaya", type: "other" },
  "shah alam": { fullName: "Shah Alam", area: "Selangor", type: "other" },
  "klcc": { fullName: "KLCC", area: "Kuala Lumpur", type: "other" },
  "bukit bintang": { fullName: "Bukit Bintang", area: "Kuala Lumpur", type: "other" },
  "bb": { fullName: "Bukit Bintang", area: "Kuala Lumpur", type: "other" },

  // Malls (common meeting points)
  "1u": { fullName: "1 Utama", area: "Petaling Jaya", type: "venue" },
  "1 utama": { fullName: "1 Utama", area: "Petaling Jaya", type: "venue" },
  "ikea": { fullName: "IKEA", area: "Various", type: "venue" },
  "mid valley": { fullName: "Mid Valley Megamall", area: "Kuala Lumpur", type: "venue" },
  "midvalley": { fullName: "Mid Valley Megamall", area: "Kuala Lumpur", type: "venue" },
  "mv": { fullName: "Mid Valley Megamall", area: "Kuala Lumpur", type: "venue" },
  "pavilion": { fullName: "Pavilion KL", area: "Kuala Lumpur", type: "venue" },
  "sunway pyramid": { fullName: "Sunway Pyramid", area: "Sunway", type: "venue" },
  "pyramid": { fullName: "Sunway Pyramid", area: "Sunway", type: "venue" },
  "ioi": { fullName: "IOI City Mall", area: "Putrajaya", type: "venue" },
  "ioi city": { fullName: "IOI City Mall", area: "Putrajaya", type: "venue" },
  "the curve": { fullName: "The Curve", area: "Petaling Jaya", type: "venue" },
  "curve": { fullName: "The Curve", area: "Petaling Jaya", type: "venue" },
  "publika": { fullName: "Publika", area: "Mont Kiara", type: "venue" },
  "nu sentral": { fullName: "Nu Sentral", area: "Kuala Lumpur", type: "venue" },
  "suria klcc": { fullName: "Suria KLCC", area: "Kuala Lumpur", type: "venue" },

  // Grocery stores
  "jaya grocer": { fullName: "Jaya Grocer", area: "Various", type: "venue" },
  "village grocer": { fullName: "Village Grocer", area: "Various", type: "venue" },
  "aeon": { fullName: "AEON", area: "Various", type: "venue" },
  "cold storage": { fullName: "Cold Storage", area: "Various", type: "venue" },

  // Office locations
  "office": { fullName: "Office", area: "", type: "office" },
  "wfh": { fullName: "Work From Home", area: "", type: "home" },
  "home": { fullName: "Home", area: "", type: "home" },
}

// Common Malay words and abbreviations
const MALAY_ABBREVIATIONS: Record<string, string> = {
  "tmr": "tomorrow",
  "tmrw": "tomorrow",
  "esok": "tomorrow",
  "hari ini": "today",
  "hr ini": "today",
  "mlm": "malam", // night
  "ptg": "petang", // afternoon
  "pg": "pagi", // morning
  "lusa": "day after tomorrow",
}

// Timezone constant
export const MALAYSIA_TIMEZONE = "Asia/Kuala_Lumpur" // UTC+8

/**
 * Expand Malaysian abbreviations in text
 */
export function expandMalaysianAbbreviations(text: string): string {
  let expanded = text.toLowerCase()

  // Expand Malay abbreviations first
  for (const [abbrev, full] of Object.entries(MALAY_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbrev}\\b`, "gi")
    expanded = expanded.replace(regex, full)
  }

  return expanded
}

/**
 * Extract location from text
 */
export function extractLocation(text: string): {
  location: string
  locationType: LocationType
  confidence: number
  rawMatch: string
} | null {
  const lowerText = text.toLowerCase()

  // Check known locations (longer matches first to avoid partial matches)
  const sortedLocations = Object.entries(MALAYSIAN_LOCATIONS)
    .sort((a, b) => b[0].length - a[0].length)

  for (const [key, info] of sortedLocations) {
    if (lowerText.includes(key)) {
      const displayLocation = info.area && info.area !== "Various" && info.area !== ""
        ? `${info.fullName}, ${info.area}`
        : info.fullName

      return {
        location: displayLocation,
        locationType: info.type,
        confidence: key.length >= 4 ? 0.95 : 0.85, // Longer matches are more confident
        rawMatch: key,
      }
    }
  }

  // Pattern match for "at [location]" - lower confidence
  const atPattern = /\bat\s+([a-z0-9\s]+?)(?:\s+(?:at|on|for|from|\d|$))/i
  const atMatch = text.match(atPattern)
  if (atMatch && atMatch[1].trim().length > 2) {
    const locationText = atMatch[1].trim()
    // Don't match time-related words
    if (!locationText.match(/\b(morning|afternoon|evening|night|pm|am)\b/i)) {
      return {
        location: locationText,
        locationType: "other",
        confidence: 0.60,
        rawMatch: atMatch[0],
      }
    }
  }

  return null
}

/**
 * Get location info by name
 */
export function getLocationInfo(name: string): LocationInfo | null {
  const lowerName = name.toLowerCase()
  return MALAYSIAN_LOCATIONS[lowerName] || null
}

/**
 * Get current Malaysian date/time
 */
export function getMalaysianDate(date: Date = new Date()): Date {
  // Create a date string in Malaysian timezone and parse it back
  const options: Intl.DateTimeFormatOptions = {
    timeZone: MALAYSIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }

  const formatter = new Intl.DateTimeFormat("en-CA", options)
  const parts = formatter.formatToParts(date)

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || "0"

  return new Date(
    parseInt(getPart("year")),
    parseInt(getPart("month")) - 1,
    parseInt(getPart("day")),
    parseInt(getPart("hour")),
    parseInt(getPart("minute")),
    parseInt(getPart("second"))
  )
}

/**
 * Format date to Malaysian format (YYYY-MM-DD)
 */
export function formatMalaysianDate(date: Date): string {
  const malaysianDate = getMalaysianDate(date)
  const year = malaysianDate.getFullYear()
  const month = String(malaysianDate.getMonth() + 1).padStart(2, "0")
  const day = String(malaysianDate.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Check if a string contains Malaysian location keywords
 */
export function hasMalaysianLocationKeyword(text: string): boolean {
  const lowerText = text.toLowerCase()
  return Object.keys(MALAYSIAN_LOCATIONS).some(key => lowerText.includes(key))
}
