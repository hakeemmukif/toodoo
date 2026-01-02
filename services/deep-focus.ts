import type { ScheduleBlock, DeepFocusAnalysis } from "@/lib/types"
import { formatDate } from "@/db"

/**
 * Calculate hours from schedule blocks
 */
function calculateHours(blocks: ScheduleBlock[]): number {
  return blocks.reduce((total, block) => {
    const [startH, startM] = block.startTime.split(":").map(Number)
    const [endH, endM] = block.endTime.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const duration = (endMinutes - startMinutes) / 60
    return total + Math.max(0, duration)
  }, 0)
}

/**
 * Calculate fragmentation score
 * Lower is better - means fewer, longer blocks
 * 0 = single continuous block, 1 = highly fragmented
 */
function calculateFragmentation(blocks: ScheduleBlock[]): number {
  if (blocks.length <= 1) return 0

  const totalHours = calculateHours(blocks)
  if (totalHours === 0) return 0

  // Average block size
  const avgBlockSize = totalHours / blocks.length

  // Ideal block size is 2+ hours
  const idealBlockSize = 2

  // Score based on how far from ideal
  const fragmentationScore = Math.min(1, Math.max(0, 1 - avgBlockSize / idealBlockSize))

  return Number(fragmentationScore.toFixed(2))
}

/**
 * Analyze deep focus for a set of schedule blocks
 */
export function analyzeDeepFocus(
  blocks: ScheduleBlock[],
  dailyTarget: number = 4
): DeepFocusAnalysis {
  const today = formatDate(new Date())
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = formatDate(weekAgo)

  // Filter blocks by date
  const todayBlocks = blocks.filter((b) => b.date === today)
  const weekBlocks = blocks.filter((b) => b.date >= weekAgoStr && b.date <= today)

  // Separate by depth
  const todayDeepBlocks = todayBlocks.filter((b) => b.depth === "deep")
  const todayShallowBlocks = todayBlocks.filter((b) => b.depth === "shallow")
  const weekDeepBlocks = weekBlocks.filter((b) => b.depth === "deep")
  const weekShallowBlocks = weekBlocks.filter((b) => b.depth === "shallow")

  // Calculate hours
  const todayDeep = calculateHours(todayDeepBlocks)
  const todayShallow = calculateHours(todayShallowBlocks)
  const weeklyDeep = calculateHours(weekDeepBlocks)
  const weeklyShallow = calculateHours(weekShallowBlocks)

  // Calculate ratio
  const todayTotal = todayDeep + todayShallow
  const ratio = todayTotal > 0 ? todayDeep / todayTotal : 0

  // Check if target met
  const targetMet = todayDeep >= dailyTarget

  // Calculate fragmentation for today's deep work
  const fragmentationScore = calculateFragmentation(todayDeepBlocks)

  // Generate alerts
  const alerts: string[] = []

  if (todayDeep < dailyTarget && todayDeep > 0) {
    const remaining = dailyTarget - todayDeep
    alerts.push(`${remaining.toFixed(1)} more hours needed to hit your deep work target`)
  }

  if (todayDeep === 0 && new Date().getHours() > 12) {
    alerts.push("No deep work logged today yet")
  }

  if (fragmentationScore > 0.5 && todayDeepBlocks.length >= 3) {
    alerts.push(
      `Your deep work was split into ${todayDeepBlocks.length} fragments today. Try longer blocks.`
    )
  }

  if (ratio < 0.5 && todayTotal > 2) {
    alerts.push("More shallow work than deep work today")
  }

  // Weekly perspective
  const dailyAvgDeep = weeklyDeep / 7
  if (dailyAvgDeep < dailyTarget * 0.7) {
    alerts.push(`Weekly average: ${dailyAvgDeep.toFixed(1)}h/day deep work (target: ${dailyTarget}h)`)
  }

  return {
    todayDeep: Number(todayDeep.toFixed(1)),
    todayShallow: Number(todayShallow.toFixed(1)),
    weeklyDeep: Number(weeklyDeep.toFixed(1)),
    weeklyShallow: Number(weeklyShallow.toFixed(1)),
    ratio: Number(ratio.toFixed(2)),
    targetMet,
    fragmentationScore,
    alerts,
  }
}

/**
 * Get deep focus summary for display
 */
export function getDeepFocusSummary(analysis: DeepFocusAnalysis): string {
  const { todayDeep, targetMet, ratio } = analysis

  if (todayDeep === 0) {
    return "No deep work yet"
  }

  if (targetMet) {
    return `${todayDeep}h deep work (target hit)`
  }

  return `${todayDeep}h deep work (${Math.round(ratio * 100)}% of today)`
}

/**
 * Get depth color for UI
 */
export function getDepthColor(depth: ScheduleBlock["depth"]): string {
  switch (depth) {
    case "deep":
      return "oklch(0.56 0.1 25)" // terracotta - intense
    case "shallow":
      return "oklch(0.65 0.05 85)" // muted gold
    case "recovery":
      return "oklch(0.58 0.08 145)" // sage - restful
    default:
      return "oklch(0.58 0.02 50)" // warm gray
  }
}

/**
 * Suggest optimal deep work times based on patterns
 */
export function suggestDeepWorkTimes(blocks: ScheduleBlock[]): string[] {
  const suggestions: string[] = []

  // Analyze when deep work is most successful
  const deepBlocks = blocks.filter((b) => b.depth === "deep")

  if (deepBlocks.length < 5) {
    suggestions.push("Log more deep work sessions to see patterns")
    return suggestions
  }

  // Group by hour
  const byHour: Record<number, number> = {}
  for (const block of deepBlocks) {
    const hour = parseInt(block.startTime.split(":")[0])
    byHour[hour] = (byHour[hour] || 0) + 1
  }

  // Find peak hours
  const sortedHours = Object.entries(byHour)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)

  if (sortedHours.length > 0) {
    const peakHour = parseInt(sortedHours[0][0])
    const timeLabel = peakHour < 12 ? `${peakHour}am` : peakHour === 12 ? "12pm" : `${peakHour - 12}pm`
    suggestions.push(`Your most common deep work time: ${timeLabel}`)
  }

  return suggestions
}
