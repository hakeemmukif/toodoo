"use client"

import { useRef, useCallback, useEffect } from "react"
import { useThree, useFrame } from "@react-three/fiber"

/**
 * Hook for on-demand rendering optimization.
 * Only renders when needed (interaction, animation, state change).
 *
 * Usage:
 * const { requestRender } = useRenderControl()
 * // Call requestRender() whenever visual changes occur
 */
export function useRenderControl() {
  const needsRenderRef = useRef(true)
  const frameCountRef = useRef(0)
  const { invalidate } = useThree()

  // Request a render on next frame
  const requestRender = useCallback(() => {
    needsRenderRef.current = true
    invalidate()
  }, [invalidate])

  // Continuous rendering for first few frames to ensure scene is set up
  useFrame(() => {
    frameCountRef.current++

    // Always render first 10 frames for initialization
    if (frameCountRef.current < 10) {
      needsRenderRef.current = true
    }

    // Reset render flag after each frame
    // (R3F's frameloop="demand" handles actual render control)
    if (needsRenderRef.current) {
      needsRenderRef.current = false
    }
  })

  return { requestRender, needsRender: needsRenderRef }
}

/**
 * Hook to get responsive 3D configuration based on device.
 * Optimizes performance for mobile devices.
 */
export function useResponsiveConfig() {
  const isMobile = typeof window !== "undefined" &&
    (window.innerWidth < 768 || "ontouchstart" in window)

  return {
    // Pixel ratio: cap at 2 for performance, 1.5 for mobile
    pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2),

    // Geometry segments: lower on mobile
    segments: {
      high: isMobile ? 32 : 48,
      medium: isMobile ? 16 : 24,
      low: isMobile ? 8 : 12,
    },

    // Starfield: fewer stars on mobile
    starCount: isMobile ? 400 : 800,

    // Atmosphere: simpler on mobile
    atmosphereSegments: isMobile ? 16 : 24,

    // Shadows: disabled on mobile
    enableShadows: !isMobile,

    // Post-processing: disabled on mobile
    enablePostProcessing: !isMobile,

    // Device type
    isMobile,
  }
}

/**
 * Hook to track performance metrics.
 * Useful for debugging and optimization.
 */
export function usePerformanceMonitor(enabled: boolean = false) {
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const fpsRef = useRef(60)

  useFrame(() => {
    if (!enabled) return

    framesRef.current++
    const now = performance.now()
    const elapsed = now - lastTimeRef.current

    // Update FPS every second
    if (elapsed >= 1000) {
      fpsRef.current = Math.round((framesRef.current * 1000) / elapsed)
      framesRef.current = 0
      lastTimeRef.current = now

      // Log performance warning if FPS drops
      if (fpsRef.current < 30) {
        console.warn(`[SolarSystem] Low FPS: ${fpsRef.current}`)
      }
    }
  })

  return { fps: fpsRef }
}
