import type { SessionItem } from "@/lib/types"

export interface StaggeredItem extends SessionItem {
  startOffsetMinutes: number  // When to add relative to phase start
  endOffsetMinutes: number    // When done relative to phase start
}

/**
 * Calculate staggered start times so all items finish together
 *
 * Example: Chicken (25min), Potatoes (20min), Broccoli (8min)
 * - Phase duration = 25min (longest item)
 * - Chicken starts at 0:00, ends at 25:00
 * - Potatoes start at 5:00, ends at 25:00
 * - Broccoli starts at 17:00, ends at 25:00
 *
 * This way everything is ready at the same time!
 */
export function calculateStaggeredTimes(items: SessionItem[]): {
  staggeredItems: StaggeredItem[]
  phaseDuration: number
} {
  if (items.length === 0) {
    return { staggeredItems: [], phaseDuration: 0 }
  }

  // Find the longest cooking time - this sets the phase duration
  const maxTime = Math.max(...items.map((item) => item.timeMinutes))

  // Calculate start offset for each item
  const staggeredItems: StaggeredItem[] = items.map((item) => {
    const startOffset = maxTime - item.timeMinutes
    return {
      ...item,
      startOffsetMinutes: startOffset,
      endOffsetMinutes: startOffset + item.timeMinutes,
    }
  })

  // Sort by start offset (earliest additions first)
  staggeredItems.sort((a, b) => a.startOffsetMinutes - b.startOffsetMinutes)

  return {
    staggeredItems,
    phaseDuration: maxTime,
  }
}

/**
 * Format a minute offset as MM:SS
 */
export function formatMinuteOffset(minutes: number): string {
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

/**
 * Calculate estimated time saved by batch cooking vs sequential
 */
export function calculateTimeSaved(
  items: SessionItem[],
  phaseDuration: number
): number {
  // Sequential: sum of all cook times + preheat between each
  const sequentialTime = items.reduce((sum, item) => sum + item.timeMinutes, 0)
  const preheatOverhead = (items.length - 1) * 3 // ~3min preheat between items

  const batchTime = phaseDuration

  return Math.max(0, sequentialTime + preheatOverhead - batchTime)
}
