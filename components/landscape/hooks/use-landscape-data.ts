"use client"

import { useMemo } from "react"
import type { LifeAspect } from "@/lib/types"
import type { LandscapeData, PeakData } from "../types"
import { MOCK_LANDSCAPE_DATA } from "../constants"

/**
 * Hook to get landscape visualization data.
 * Currently uses mock data for development.
 * Toggle useMock=false to connect real stores (Phase 8).
 */
export function useLandscapeData(useMock: boolean = true): LandscapeData {
  const peaks = useMemo(() => {
    if (useMock) {
      return MOCK_LANDSCAPE_DATA
    }

    // TODO: Connect real data in Phase 8
    // This will use:
    // - calculateAspectProgress() from services/progress.ts
    // - useTasksStore for pending tasks per aspect
    // - useTrainingStore.calculateStreak() for fitness
    // - useMealsStore.getCookingStats().cookingStreak for nutrition

    return MOCK_LANDSCAPE_DATA
  }, [useMock])

  return {
    peaks,
    isLoading: false,
  }
}

/**
 * Get peak data as array for iteration
 */
export function usePeakDataArray(useMock: boolean = true): PeakData[] {
  const { peaks } = useLandscapeData(useMock)

  return useMemo(() => {
    const aspects: LifeAspect[] = [
      "fitness",
      "nutrition",
      "career",
      "financial",
      "side-projects",
      "chores",
    ]
    return aspects.map((aspect) => peaks[aspect])
  }, [peaks])
}
