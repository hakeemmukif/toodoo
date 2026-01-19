"use client"

import dynamic from "next/dynamic"
import type { LandscapeProps } from "./types"

/**
 * Lazy-loaded 3D Living Landscape (legacy terrain visualization).
 * Splits Three.js bundle for faster initial page load.
 */
const LivingLandscape = dynamic(() => import("./LivingLandscape"), {
  ssr: false,
  loading: () => <LandscapeSkeleton />,
})

export { LivingLandscape }
export type { LandscapeProps }

// Re-export the new Solar System visualization
export { SolarSystemVisualization } from "./solar-system"
export type { SolarSystemProps, PlanetData, PlanetFill } from "./solar-system"

/**
 * Loading skeleton while 3D assets load.
 */
function LandscapeSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-lg animate-pulse">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 mx-auto rounded-full bg-muted/30" />
        <div className="text-xs text-muted-foreground">Loading landscape...</div>
      </div>
    </div>
  )
}
