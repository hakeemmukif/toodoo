"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { ANIMATION_CONFIG } from "../constants"

interface BreathingValues {
  terrain: number
  crystal: number
  orbital: number
}

/**
 * Hook for ambient breathing animations.
 * Returns refs that update each frame with sine-wave values.
 */
export function useBreathing(): React.MutableRefObject<BreathingValues> {
  const valuesRef = useRef<BreathingValues>({
    terrain: 0,
    crystal: 1,
    orbital: 1,
  })

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { breathing } = ANIMATION_CONFIG

    // Terrain: Y offset oscillation
    valuesRef.current.terrain =
      Math.sin(t * breathing.terrain.frequency * Math.PI * 2) * breathing.terrain.amplitude

    // Crystal: Scale multiplier
    valuesRef.current.crystal =
      1 + Math.sin(t * breathing.crystal.frequency * Math.PI * 2) * breathing.crystal.amplitude

    // Orbital: Scale multiplier (offset phase)
    valuesRef.current.orbital =
      1 +
      Math.sin(t * breathing.orbital.frequency * Math.PI * 2 + Math.PI / 3) *
        breathing.orbital.amplitude
  })

  return valuesRef
}
