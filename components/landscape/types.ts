import type { LifeAspect } from "@/lib/types"

export interface PeakData {
  aspect: LifeAspect
  progress: number      // 0-100
  streak: number        // Days for crystal size
  taskCount: number     // Number of pending tasks for orbitals
}

export interface LandscapeData {
  peaks: Record<LifeAspect, PeakData>
  isLoading: boolean
}

export interface LandscapeProps {
  onAspectClick?: (aspect: LifeAspect) => void
  onAspectHover?: (aspect: LifeAspect | null) => void
  className?: string
}

export interface ResponsiveConfig {
  terrainSegments: number
  maxOrbitals: number
  pixelRatio: number
  enableBloom: boolean
}
