"use client"

import { Sparkles } from "@react-three/drei"

interface AmbientParticlesProps {
  enabled?: boolean
}

/**
 * Ambient floating sparkles for magical atmosphere.
 * Uses drei's Sparkles component which is optimized with instancing.
 *
 * Two layers:
 * 1. Warm gold sparkles (primary) - larger, slower
 * 2. Cool white sparkles (accent) - smaller, faster
 *
 * Creates depth and life without overwhelming the main visualization.
 */
export function AmbientParticles({ enabled = true }: AmbientParticlesProps) {
  if (!enabled) return null

  return (
    <>
      {/* Primary warm sparkles - larger, slower, gold tone */}
      <Sparkles
        count={60}
        scale={10}
        size={2}
        speed={0.2}
        opacity={0.4}
        color="#B8A068"
        noise={1}
      />

      {/* Secondary cool sparkles - smaller, faster, white */}
      <Sparkles
        count={40}
        scale={8}
        size={1}
        speed={0.4}
        opacity={0.25}
        color="#E8E4DF"
        noise={1.5}
      />

      {/* Accent sparkles near peaks - concentrated, subtle */}
      <Sparkles
        count={30}
        scale={5}
        size={1.5}
        speed={0.15}
        opacity={0.3}
        color="#C4726C"
        noise={0.5}
        position={[0, 0.5, 0]}
      />
    </>
  )
}
