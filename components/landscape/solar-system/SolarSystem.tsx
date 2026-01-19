"use client"

import { useState, useCallback, useMemo } from "react"
import { Canvas } from "@react-three/fiber"
import * as THREE from "three"
import type { SolarSystemProps, ZoomLevel, PlanetData } from "./types"
import { CAMERA_CONFIG, SPACE_COLORS } from "./constants"
import { useSolarData } from "./hooks/use-solar-data"
import { useResponsiveConfig } from "./hooks/use-render-control"
import { Planet } from "./scene/Planet"
import { OrbitPath } from "./scene/OrbitPath"
import { Starfield, SpaceAmbience } from "./scene/Starfield"
import { CameraController } from "./scene/CameraController"

interface SceneContentProps {
  planets: PlanetData[]
  currentMonth: number
  zoomLevel: ZoomLevel
  focusedPlanet: number | null
  hoveredPlanet: number | null
  onPlanetClick: (index: number) => void
  onPlanetHover: (index: number | null) => void
}

/**
 * Scene content - all 3D elements
 */
function SceneContent({
  planets,
  currentMonth,
  zoomLevel,
  focusedPlanet,
  hoveredPlanet,
  onPlanetClick,
  onPlanetHover,
}: SceneContentProps) {
  return (
    <>
      {/* Camera controller for zoom transitions */}
      <CameraController
        zoomLevel={zoomLevel}
        focusedPlanet={focusedPlanet}
      />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffeedd" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#aabbff" />

      {/* Background elements */}
      <Starfield />
      <SpaceAmbience />

      {/* Zigzag orbit path */}
      <OrbitPath currentMonth={currentMonth} />

      {/* Planets */}
      {planets.map((planet, index) => (
        <Planet
          key={planet.month}
          data={planet}
          isFocused={focusedPlanet === index}
          isHovered={hoveredPlanet === index}
          onClick={() => onPlanetClick(index)}
          onHover={(hovered) => onPlanetHover(hovered ? index : null)}
        />
      ))}
    </>
  )
}

/**
 * UI overlay for zoom controls and info
 */
function UIOverlay({
  zoomLevel,
  focusedPlanet,
  planets,
  onZoomOut,
}: {
  zoomLevel: ZoomLevel
  focusedPlanet: number | null
  planets: PlanetData[]
  onZoomOut: () => void
}) {
  const focusedData = focusedPlanet !== null ? planets[focusedPlanet] : null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Zoom out button when focused on planet */}
      {zoomLevel === "planet" && (
        <button
          onClick={onZoomOut}
          className="absolute top-4 left-4 px-3 py-2 bg-gray-800/80 hover:bg-gray-700/90 text-gray-200 text-sm rounded-lg pointer-events-auto transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
          View All
        </button>
      )}

      {/* Planet info panel when focused */}
      {focusedData && zoomLevel === "planet" && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            {focusedData.monthName} {focusedData.isCurrent && <span className="text-yellow-400 text-sm">(Current)</span>}
          </h3>

          {focusedData.isFuture ? (
            <div className="text-gray-400 text-sm">
              {focusedData.plannedFill && focusedData.plannedFill.overall > 0 ? (
                <>
                  <p className="mb-2">Planned activity:</p>
                  <div className="space-y-1">
                    <FillBar label="Tasks" value={focusedData.plannedFill.tasks} muted />
                    <FillBar label="Goals" value={focusedData.plannedFill.goals} muted />
                    <FillBar label="Events" value={focusedData.plannedFill.events} muted />
                  </div>
                </>
              ) : (
                <p>No plans yet for this month.</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <FillBar label="Tasks" value={focusedData.fill.tasks} />
              <FillBar label="Goals" value={focusedData.fill.goals} />
              <FillBar label="Habits" value={focusedData.fill.habits} />
              <FillBar label="Journal" value={focusedData.fill.journal} />
              <FillBar label="Events" value={focusedData.fill.events} />
              <div className="mt-2 pt-2 border-t border-gray-700">
                <FillBar label="Overall" value={focusedData.fill.overall} highlight />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions when in system view */}
      {zoomLevel === "system" && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs pointer-events-none">
          Click a planet to zoom in | Scroll to zoom | Right-drag to orbit
        </div>
      )}
    </div>
  )
}

/**
 * Fill bar component for the info panel
 */
function FillBar({
  label,
  value,
  muted = false,
  highlight = false,
}: {
  label: string
  value: number
  muted?: boolean
  highlight?: boolean
}) {
  const percentage = Math.round(value * 100)

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-16 ${muted ? "text-gray-500" : "text-gray-400"}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            muted
              ? "bg-gray-600"
              : highlight
                ? "bg-yellow-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`w-8 text-right ${highlight ? "text-yellow-400" : muted ? "text-gray-500" : "text-gray-300"}`}>
        {percentage}%
      </span>
    </div>
  )
}

/**
 * Main Solar System visualization component
 */
export function SolarSystem({ onPlanetClick, onPlanetHover, className }: SolarSystemProps) {
  const { planets, currentMonth } = useSolarData(true) // Use mock data for now
  const responsiveConfig = useResponsiveConfig()

  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("system")
  const [focusedPlanet, setFocusedPlanet] = useState<number | null>(null)
  const [hoveredPlanet, setHoveredPlanet] = useState<number | null>(null)

  const handlePlanetClick = useCallback((index: number) => {
    if (focusedPlanet === index) {
      // Clicking same planet zooms out
      setZoomLevel("system")
      setFocusedPlanet(null)
    } else {
      // Zoom in to clicked planet
      setZoomLevel("planet")
      setFocusedPlanet(index)
      onPlanetClick?.(planets[index].month)
    }
  }, [focusedPlanet, planets, onPlanetClick])

  const handlePlanetHover = useCallback((index: number | null) => {
    setHoveredPlanet(index)
    onPlanetHover?.(index !== null ? planets[index].month : null)
  }, [planets, onPlanetHover])

  const handleZoomOut = useCallback(() => {
    setZoomLevel("system")
    setFocusedPlanet(null)
  }, [])

  // Memoize GL config to prevent recreating on every render
  const glConfig = useMemo(() => ({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance" as const,
    stencil: false,
    depth: true,
    // Tone mapping for better color reproduction
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.0,
    outputColorSpace: THREE.SRGBColorSpace,
  }), [])

  return (
    <div className={`relative w-full h-full ${className || ""}`}>
      <Canvas
        dpr={responsiveConfig.pixelRatio}
        camera={{
          position: CAMERA_CONFIG.system.position,
          fov: CAMERA_CONFIG.system.fov,
          near: 0.1,
          far: 100,
        }}
        style={{ background: SPACE_COLORS.background }}
        gl={glConfig}
      >
        <SceneContent
          planets={planets}
          currentMonth={currentMonth}
          zoomLevel={zoomLevel}
          focusedPlanet={focusedPlanet}
          hoveredPlanet={hoveredPlanet}
          onPlanetClick={handlePlanetClick}
          onPlanetHover={handlePlanetHover}
        />
      </Canvas>

      <UIOverlay
        zoomLevel={zoomLevel}
        focusedPlanet={focusedPlanet}
        planets={planets}
        onZoomOut={handleZoomOut}
      />
    </div>
  )
}
