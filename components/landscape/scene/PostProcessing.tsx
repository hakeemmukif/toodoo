"use client"

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"

interface PostProcessingProps {
  enabled?: boolean
}

/**
 * Post-processing effects for cinematic visual quality.
 *
 * Bloom: Makes emissive materials glow (selective, only picks up values > luminanceThreshold)
 * Vignette: Subtle darkening at edges to focus attention on center
 *
 * Disabled on mobile for performance.
 */
export function PostProcessing({ enabled = true }: PostProcessingProps) {
  if (!enabled) return null

  return (
    <EffectComposer multisampling={4}>
      {/* Selective bloom - only affects materials with emissive > 1 and toneMapped={false} */}
      <Bloom
        luminanceThreshold={0.8}
        luminanceSmoothing={0.025}
        intensity={0.6}
        mipmapBlur
        radius={0.8}
      />

      {/* Subtle vignette for focus and cinematic feel */}
      <Vignette
        offset={0.3}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
