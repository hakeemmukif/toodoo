// Solar System Visualization Types

export interface PlanetFill {
  tasks: number       // 0-1 ratio completed/total
  goals: number       // 0-1 ratio achieved/total
  habits: number      // 0-1 average habit streak %
  journal: number     // 0-1 based on entry count
  events: number      // 0-1 ratio attended/total
  overall: number     // 0-1 weighted composite
}

export interface PlanetData {
  month: string             // "2026-01" format
  monthIndex: number        // 0-11 (Jan=0)
  monthName: string         // "January", "February", etc.
  fill: PlanetFill
  plannedFill?: PlanetFill  // For future months - what's planned
  isCurrent: boolean
  isPast: boolean
  isFuture: boolean
  dayProgress?: number      // 0-1 position within month (current only)
}

export interface SolarSystemData {
  planets: PlanetData[]
  currentDayOfYear: number
  currentMonth: number      // 0-11
  year: number
  isLoading: boolean
}

export type TimeState = 'past' | 'current' | 'future'

export interface PlanetPosition {
  x: number
  y: number
  z: number
}

export interface SolarSystemProps {
  onPlanetClick?: (month: string) => void
  onPlanetHover?: (month: string | null) => void
  className?: string
}

// Camera state for zoom levels
export type ZoomLevel = 'system' | 'planet'

export interface CameraState {
  zoom: ZoomLevel
  focusedPlanet: number | null  // monthIndex or null for system view
}
