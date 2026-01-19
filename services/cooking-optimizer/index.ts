import { generateId } from "@/db"
import type {
  SessionItem,
  CookingPhase,
  CookingBatch,
  OptimizationResult,
} from "@/lib/types"
import { groupByTemperature, calculateGroupingStats } from "./group-by-temperature"
import { calculateStaggeredTimes, calculateTimeSaved } from "./stagger-calculator"
import { generatePhaseEvents, consolidateEvents } from "./event-generator"
import { getAverageTemperature } from "./temperature-hints"

const REST_BETWEEN_PHASES = 2 // Minutes to wait between temp phases

// Temperature validation constants (Celsius)
const MIN_TEMPERATURE = 80   // Most air fryers minimum
const MAX_TEMPERATURE = 260  // Most air fryers maximum
const DEFAULT_TEMPERATURE = 180

/**
 * Validate and clamp temperature to safe air fryer range
 */
function validateTemperature(temp: number): number {
  if (!Number.isFinite(temp) || temp < MIN_TEMPERATURE) {
    return DEFAULT_TEMPERATURE
  }
  return Math.min(temp, MAX_TEMPERATURE)
}

/**
 * Validate items and ensure temperatures are within range
 */
function validateItems(items: SessionItem[]): SessionItem[] {
  return items.map((item) => ({
    ...item,
    temperature: validateTemperature(item.temperature),
    timeMinutes: Math.max(1, Math.min(item.timeMinutes, 120)), // 1-120 min range
  }))
}

// Optimization options
export interface OptimizationOptions {
  mode: "auto" | "manual-batches"
  batches?: CookingBatch[]
}

/**
 * Main optimization function
 *
 * Supports two modes:
 * - "auto": Groups items by temperature automatically (default)
 * - "manual-batches": Uses user-defined batches, only optimizes timing within each
 *
 * Takes a list of items and produces an optimized cooking plan:
 * 1. Groups items by similar temperature (within 10C) OR uses manual batches
 * 2. Within each group/batch, staggers start times so items finish together
 * 3. Generates timeline events for guided cooking
 *
 * Example input:
 *   - Chicken: 25min @ 200C
 *   - Potatoes: 20min @ 200C
 *   - Brussels: 12min @ 180C
 *   - Broccoli: 8min @ 180C
 *
 * Output phases:
 *   Phase 1 (200C, 25min): Chicken at 0:00, Potatoes at 5:00
 *   Phase 2 (180C, 12min): Brussels at 0:00, Broccoli at 4:00
 */
export function optimizeCookingSession(
  items: SessionItem[],
  options?: OptimizationOptions
): OptimizationResult {
  // Validate items first to ensure safe temperature/time ranges
  const validatedItems = validateItems(items)

  // Use manual batching if specified
  if (options?.mode === "manual-batches" && options.batches) {
    return optimizeWithManualBatches(validatedItems, options.batches)
  }

  // Default: auto-grouping by temperature
  return optimizeAutoGrouped(validatedItems)
}

/**
 * Optimize with user-defined batches
 * Respects user's batch groupings (what cooks together),
 * only optimizes timing WITHIN each batch
 */
function optimizeWithManualBatches(
  items: SessionItem[],
  batches: CookingBatch[]
): OptimizationResult {
  if (items.length === 0 || batches.length === 0) {
    return {
      phases: [],
      totalMinutes: 0,
      temperatureGroups: 0,
      parallelItems: 0,
      efficiencyGain: 0,
    }
  }

  const phases: CookingPhase[] = []
  let cumulativeTime = 0
  let totalTimeSaved = 0
  let totalParallelItems = 0

  // Sort batches by order
  const sortedBatches = [...batches].sort((a, b) => a.order - b.order)

  for (let i = 0; i < sortedBatches.length; i++) {
    const batch = sortedBatches[i]

    // Get items in this batch
    const batchItems = items.filter((item) => batch.itemIds.includes(item.id))

    if (batchItems.length === 0) continue

    // Calculate average temperature for this batch
    const targetTemperature = getAverageTemperature(batchItems)

    // Calculate staggered times for items in this batch
    const { staggeredItems, phaseDuration } = calculateStaggeredTimes(batchItems)

    // Calculate time saved
    const savedTime = calculateTimeSaved(batchItems, phaseDuration)
    totalTimeSaved += savedTime

    if (batchItems.length > 1) {
      totalParallelItems += batchItems.length
    }

    // Generate events
    const events = generatePhaseEvents(staggeredItems, targetTemperature)
    const consolidatedEvents = consolidateEvents(events)

    // Add rest time after batch (except for last batch)
    const restAfter = i < sortedBatches.length - 1 ? REST_BETWEEN_PHASES : 0

    phases.push({
      id: batch.id, // Use batch ID as phase ID for consistency
      order: i,
      targetTemperature,
      totalDurationMinutes: phaseDuration,
      itemIds: batchItems.map((item) => item.id),
      restMinutesAfter: restAfter,
      events: consolidatedEvents,
    })

    cumulativeTime += phaseDuration + restAfter
  }

  return {
    phases,
    totalMinutes: cumulativeTime,
    temperatureGroups: phases.length,
    parallelItems: totalParallelItems,
    efficiencyGain: totalTimeSaved,
  }
}

/**
 * Auto-grouped optimization (original algorithm)
 */
function optimizeAutoGrouped(items: SessionItem[]): OptimizationResult {
  if (items.length === 0) {
    return {
      phases: [],
      totalMinutes: 0,
      temperatureGroups: 0,
      parallelItems: 0,
      efficiencyGain: 0,
    }
  }

  // Step 1: Group by temperature
  const temperatureGroups = groupByTemperature(items)
  const groupStats = calculateGroupingStats(temperatureGroups)

  // Step 2: Create phases with staggered timing
  const phases: CookingPhase[] = []
  let cumulativeTime = 0
  let totalTimeSaved = 0

  for (let i = 0; i < temperatureGroups.length; i++) {
    const group = temperatureGroups[i]

    // Calculate staggered times for items in this group
    const { staggeredItems, phaseDuration } = calculateStaggeredTimes(group.items)

    // Update items with computed offsets
    const updatedItems = staggeredItems.map((item) => ({
      ...item,
      phaseId: `phase-${i}`,
    }))

    // Calculate time saved for this phase
    const savedTime = calculateTimeSaved(group.items, phaseDuration)
    totalTimeSaved += savedTime

    // Generate events
    const events = generatePhaseEvents(staggeredItems, group.targetTemperature)
    const consolidatedEvents = consolidateEvents(events)

    // Add rest time after phase (except for last phase)
    const restAfter = i < temperatureGroups.length - 1 ? REST_BETWEEN_PHASES : 0

    phases.push({
      id: generateId(),
      order: i,
      targetTemperature: group.targetTemperature,
      totalDurationMinutes: phaseDuration,
      itemIds: updatedItems.map((item) => item.id),
      restMinutesAfter: restAfter,
      events: consolidatedEvents,
    })

    cumulativeTime += phaseDuration + restAfter
  }

  return {
    phases,
    totalMinutes: cumulativeTime,
    temperatureGroups: groupStats.temperatureGroups,
    parallelItems: groupStats.parallelItems,
    efficiencyGain: totalTimeSaved,
  }
}

/**
 * Quick estimate of total cooking time without full optimization
 */
export function estimateTotalTime(items: SessionItem[]): number {
  const groups = groupByTemperature(items)

  let total = 0
  for (let i = 0; i < groups.length; i++) {
    const maxTime = Math.max(...groups[i].items.map((item) => item.timeMinutes))
    total += maxTime
    // Add rest time between phases
    if (i < groups.length - 1) {
      total += REST_BETWEEN_PHASES
    }
  }

  return total
}

/**
 * Get a summary of the optimization for display
 */
export function getOptimizationSummary(result: OptimizationResult): string {
  if (result.phases.length === 0) {
    return "No items to cook"
  }

  const lines: string[] = []

  lines.push(`Total time: ${result.totalMinutes} minutes`)
  lines.push(`Temperature phases: ${result.temperatureGroups}`)

  if (result.parallelItems > 0) {
    lines.push(`Items cooking in parallel: ${result.parallelItems}`)
  }

  if (result.efficiencyGain > 0) {
    lines.push(`Time saved vs sequential: ~${result.efficiencyGain} min`)
  }

  return lines.join("\n")
}

// Re-export utilities
export { groupByTemperature } from "./group-by-temperature"
export { calculateStaggeredTimes, formatMinuteOffset } from "./stagger-calculator"
export { generatePhaseEvents, getEventDescription } from "./event-generator"
