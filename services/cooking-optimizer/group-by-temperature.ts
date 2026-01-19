import type { SessionItem } from "@/lib/types"

const TEMPERATURE_TOLERANCE = 10 // Celsius - items within this range can cook together

interface TemperatureGroup {
  targetTemperature: number
  items: SessionItem[]
}

/**
 * Groups cooking items by similar temperature
 * Items within 10C of each other can be cooked together
 *
 * Algorithm:
 * 1. Sort items by temperature descending (cook hottest first)
 * 2. For each item, find or create a group within tolerance
 * 3. Group temperature = average of all items in group
 */
export function groupByTemperature(items: SessionItem[]): TemperatureGroup[] {
  if (items.length === 0) return []

  // Sort by temperature descending (hottest first = less waiting for temp to drop)
  const sorted = [...items].sort((a, b) => b.temperature - a.temperature)

  const groups: TemperatureGroup[] = []

  for (const item of sorted) {
    // Find existing group within tolerance
    let foundGroup = groups.find(
      (group) => Math.abs(group.targetTemperature - item.temperature) <= TEMPERATURE_TOLERANCE
    )

    if (foundGroup) {
      foundGroup.items.push(item)
      // Recalculate group temperature as average
      foundGroup.targetTemperature = Math.round(
        foundGroup.items.reduce((sum, i) => sum + i.temperature, 0) / foundGroup.items.length
      )
    } else {
      // Create new group
      groups.push({
        targetTemperature: item.temperature,
        items: [item],
      })
    }
  }

  // Sort groups by temperature descending
  return groups.sort((a, b) => b.targetTemperature - a.targetTemperature)
}

/**
 * Calculate efficiency stats for the grouping
 */
export function calculateGroupingStats(groups: TemperatureGroup[]) {
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0)
  const parallelItems = groups.reduce((sum, g) => sum + (g.items.length > 1 ? g.items.length : 0), 0)

  return {
    temperatureGroups: groups.length,
    totalItems,
    parallelItems,
    // If we cooked everything sequentially vs batched
    sequentialPhases: totalItems,
    batchedPhases: groups.length,
  }
}
