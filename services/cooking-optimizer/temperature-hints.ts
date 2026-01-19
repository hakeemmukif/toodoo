import type { SessionItem, TemperatureHint } from "@/lib/types"

/**
 * Calculate temperature compatibility hint for items in a batch
 *
 * Helps users understand if items they've grouped together have
 * compatible cooking temperatures:
 * - ok (green): Items within 10C - cook at average temp
 * - warning (yellow): 10-25C range - works but not ideal
 * - mismatch (red): >25C range - consider separate batches
 */
export function calculateTemperatureHint(items: SessionItem[]): TemperatureHint {
  if (items.length === 0) {
    return {
      severity: "ok",
      message: "No items",
      temperatureRange: { min: 0, max: 0 },
    }
  }

  if (items.length === 1) {
    const temp = items[0].temperature
    return {
      severity: "ok",
      message: `${temp}C`,
      temperatureRange: { min: temp, max: temp },
    }
  }

  const temps = items.map((i) => i.temperature)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = max - min
  const avg = Math.round((min + max) / 2)

  if (range <= 10) {
    return {
      severity: "ok",
      message: `Good match (${avg}C)`,
      temperatureRange: { min, max },
    }
  }

  if (range <= 25) {
    return {
      severity: "warning",
      message: `${range}C range - cook at ${avg}C`,
      temperatureRange: { min, max },
    }
  }

  return {
    severity: "mismatch",
    message: `${range}C gap - consider separate batches`,
    temperatureRange: { min, max },
  }
}

/**
 * Get the average temperature for a batch of items
 */
export function getAverageTemperature(items: SessionItem[]): number {
  if (items.length === 0) return 180 // Default
  const sum = items.reduce((acc, item) => acc + item.temperature, 0)
  return Math.round(sum / items.length)
}

/**
 * Get the longest cooking time in a batch (determines phase duration)
 */
export function getLongestCookTime(items: SessionItem[]): number {
  if (items.length === 0) return 0
  return Math.max(...items.map((item) => item.timeMinutes))
}

/**
 * Get color class for temperature hint severity
 */
export function getTemperatureHintColor(severity: TemperatureHint["severity"]): string {
  switch (severity) {
    case "ok":
      return "text-green-600 bg-green-500/10 border-green-500/30"
    case "warning":
      return "text-yellow-600 bg-yellow-500/10 border-yellow-500/30"
    case "mismatch":
      return "text-red-600 bg-red-500/10 border-red-500/30"
  }
}
