"use client"

import dynamic from "next/dynamic"
import { Component, type ReactNode } from "react"
import type { SolarSystemProps } from "./types"

// Error boundary for 3D canvas
class SolarSystemErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f] text-red-400 p-4">
          <div className="text-center">
            <p className="text-sm mb-2">Failed to load solar system</p>
            <p className="text-xs text-gray-500">{this.state.error?.message}</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Lazy load the 3D solar system to keep Three.js out of initial bundle
const SolarSystemCanvas = dynamic(
  () => import("./SolarSystem").then((mod) => ({ default: mod.SolarSystem })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-gray-500 text-sm animate-pulse">Loading solar system...</div>
      </div>
    ),
  }
)

/**
 * Solar System Visualization
 *
 * 12 planets representing each month of the year.
 * - Past months: dimmer, showing completed activity
 * - Current month: lit and highlighted
 * - Future months: greyed out, can show planned data
 *
 * Planets connected by dotted zigzag path.
 * Click to zoom into a planet, scroll to zoom system view.
 */
export function SolarSystemVisualization(props: SolarSystemProps) {
  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      <SolarSystemErrorBoundary>
        <SolarSystemCanvas {...props} />
      </SolarSystemErrorBoundary>
    </div>
  )
}

// Re-export types
export type { SolarSystemProps, PlanetData, PlanetFill, SolarSystemData } from "./types"
