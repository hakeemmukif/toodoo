"use client"

import { useMemo } from "react"
import type { LifeAspect } from "@/lib/types"
import { PEAK_POSITIONS, CAMERA_CONFIG, FOCUS_CONFIG, TERRAIN_CONFIG } from "../constants"
import type { PeakData } from "../types"

export interface CameraTarget {
  position: [number, number, number]
  lookAt: [number, number, number]
}

interface UseFocusCameraOptions {
  focusedAspect: LifeAspect | null
  peaks: Record<LifeAspect, PeakData>
}

/**
 * Calculates camera positions for overview and focused states.
 *
 * When focused on a peak, the camera positions itself at an angle
 * that gives a good view of the peak while keeping it centered.
 * The position is calculated using polar coordinates offset from
 * the peak center.
 */
export function useFocusCamera({ focusedAspect, peaks }: UseFocusCameraOptions): CameraTarget {
  return useMemo(() => {
    // Overview mode: standard isometric-ish view
    if (!focusedAspect) {
      return {
        position: CAMERA_CONFIG.position,
        lookAt: [0, 0, 0] as [number, number, number],
      }
    }

    // Focused mode: calculate position relative to peak
    const peakPos = PEAK_POSITIONS[focusedAspect]
    const peakProgress = peaks[focusedAspect]?.progress ?? 50
    const peakHeight = (peakProgress / 100) * TERRAIN_CONFIG.maxHeight

    // Calculate angle from center to peak (for camera positioning)
    const angleToCenter = Math.atan2(peakPos[2], peakPos[0])

    // Position camera on the opposite side of the peak from center
    // This ensures we're looking "into" the scene, not at empty space
    const cameraAngle = angleToCenter + Math.PI + FOCUS_CONFIG.cameraAngle

    const cameraX = peakPos[0] + Math.cos(cameraAngle) * FOCUS_CONFIG.cameraDistance
    const cameraZ = peakPos[2] + Math.sin(cameraAngle) * FOCUS_CONFIG.cameraDistance
    const cameraY = peakHeight + FOCUS_CONFIG.cameraHeight

    // Look at a point slightly above the peak (where the crystal sits)
    const lookAtY = peakHeight + 0.3

    return {
      position: [cameraX, cameraY, cameraZ] as [number, number, number],
      lookAt: [peakPos[0], lookAtY, peakPos[2]] as [number, number, number],
    }
  }, [focusedAspect, peaks])
}

/**
 * Gets the peak center position with height for tooltip/UI positioning.
 */
export function getPeakWorldPosition(
  aspect: LifeAspect,
  peaks: Record<LifeAspect, PeakData>
): [number, number, number] {
  const pos = PEAK_POSITIONS[aspect]
  const progress = peaks[aspect]?.progress ?? 50
  const height = (progress / 100) * TERRAIN_CONFIG.maxHeight
  return [pos[0], height, pos[2]]
}
