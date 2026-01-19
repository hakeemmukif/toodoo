"use client"

import { useMemo } from "react"
import type { PlanetData, PlanetFill, SolarSystemData } from "../types"
import { MONTH_NAMES, EMPTY_FILL, MOCK_PLANET_FILLS } from "../constants"

/**
 * Calculate weighted average for overall fill
 */
function weightedAverage(values: [number, number][]): number {
  const totalWeight = values.reduce((sum, [, weight]) => sum + weight, 0)
  const weightedSum = values.reduce((sum, [value, weight]) => sum + value * weight, 0)
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

/**
 * Get the current date info
 */
function getDateInfo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const day = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dayProgress = day / daysInMonth

  // Calculate day of year
  const startOfYear = new Date(year, 0, 0)
  const diff = now.getTime() - startOfYear.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  return { year, month, day, dayProgress, dayOfYear, daysInMonth }
}

/**
 * Format month string from year and month index
 */
function formatMonth(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`
}

/**
 * Hook to get solar system visualization data.
 * Toggle useMock for development vs real data.
 */
export function useSolarData(useMock: boolean = true): SolarSystemData {
  const planets = useMemo(() => {
    const { year, month: currentMonth, dayProgress, dayOfYear } = getDateInfo()

    const planetData: PlanetData[] = []

    for (let i = 0; i < 12; i++) {
      const isPast = i < currentMonth
      const isCurrent = i === currentMonth
      const isFuture = i > currentMonth

      // Get fill data
      let fill: PlanetFill
      let plannedFill: PlanetFill | undefined

      if (useMock) {
        // Use mock data for past/current months
        if (isPast || isCurrent) {
          fill = MOCK_PLANET_FILLS[i] || EMPTY_FILL
        } else {
          // Future months are empty but may have plans
          fill = EMPTY_FILL
          // Mock some planned tasks for future months
          if (i === currentMonth + 1) {
            plannedFill = {
              tasks: 0.4,
              goals: 0.2,
              habits: 0,
              journal: 0,
              events: 0.3,
              overall: 0.25,
            }
          }
        }
      } else {
        // TODO: Connect real data
        // This will query Dexie for each month's data:
        // - tasks where scheduledDate starts with month string
        // - goals for that month
        // - habit streaks
        // - journal entries
        // - calendar events
        fill = EMPTY_FILL
      }

      planetData.push({
        month: formatMonth(year, i),
        monthIndex: i,
        monthName: MONTH_NAMES[i],
        fill,
        plannedFill,
        isCurrent,
        isPast,
        isFuture,
        dayProgress: isCurrent ? dayProgress : undefined,
      })
    }

    return planetData
  }, [useMock])

  const { year, month: currentMonth, dayOfYear } = getDateInfo()

  return {
    planets,
    currentDayOfYear: dayOfYear,
    currentMonth,
    year,
    isLoading: false,
  }
}

/**
 * Calculate fill for a specific month from real data
 * TODO: Implement when connecting real stores
 */
export async function calculateMonthFill(
  month: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _stores: {
    tasks: unknown[]
    goals: unknown[]
    habits: unknown[]
    journal: unknown[]
    events: unknown[]
  }
): Promise<PlanetFill> {
  // Placeholder implementation
  // Will be replaced with actual Dexie queries

  return {
    tasks: 0,
    goals: 0,
    habits: 0,
    journal: 0,
    events: 0,
    overall: 0,
  }
}

/**
 * Get fill state label from overall fill value
 */
export function getFillState(overall: number): "empty" | "starting" | "growing" | "active" | "thriving" {
  if (overall < 0.01) return "empty"
  if (overall < 0.26) return "starting"
  if (overall < 0.51) return "growing"
  if (overall < 0.76) return "active"
  return "thriving"
}
