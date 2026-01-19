"use client"

import { useMemo } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ResponsiveConfig } from "../types"
import { TERRAIN_CONFIG, ORBITAL_CONFIG } from "../constants"

/**
 * Hook for responsive 3D configuration.
 * Reduces complexity on mobile for better performance.
 */
export function useResponsive3D(): ResponsiveConfig {
  const isMobile = useIsMobile()

  return useMemo(
    () => ({
      terrainSegments: isMobile ? TERRAIN_CONFIG.mobileSegments : TERRAIN_CONFIG.segments,
      maxOrbitals: isMobile ? ORBITAL_CONFIG.mobileMaxParticles : ORBITAL_CONFIG.maxParticles,
      pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2),
      enableBloom: !isMobile,
    }),
    [isMobile]
  )
}
