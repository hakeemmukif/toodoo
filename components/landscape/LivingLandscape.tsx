"use client"

import { Suspense, useState, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import type { LifeAspect } from "@/lib/types"
import type { LandscapeProps } from "./types"
import { ASPECT_CONFIG } from "@/lib/constants"
import { useLandscapeData } from "./hooks/use-landscape-data"
import { useResponsive3D } from "./hooks/use-responsive-3d"
import { useFocusCamera } from "./hooks/use-focus-camera"
import { SceneLighting } from "./scene/SceneLighting"
import { AnimatedCamera } from "./scene/AnimatedCamera"
import { TerrainMesh } from "./scene/TerrainMesh"
import { CrystalField } from "./scene/CrystalField"
import { OrbitalSystem } from "./scene/OrbitalSystem"
import { PostProcessing } from "./scene/PostProcessing"
import { GradientBackground } from "./scene/GradientBackground"
import { AmbientParticles } from "./scene/AmbientParticles"
import { AspectPanel } from "./AspectPanel"
import { PEAK_POSITIONS } from "./constants"
import { cn } from "@/lib/utils"

/**
 * Main 3D Living Landscape visualization.
 * Displays terrain with peaks (progress), crystals (streaks), and orbitals (tasks).
 *
 * Click a peak to focus: camera zooms in with a detail panel appearing on the left.
 * Click elsewhere or the back button to return to overview.
 */
export default function LivingLandscape({
  onAspectClick,
  onAspectHover,
  className,
}: LandscapeProps) {
  const { peaks } = useLandscapeData(true) // Use mock data
  const { terrainSegments, maxOrbitals, pixelRatio, enableBloom } = useResponsive3D()
  const [hoveredAspect, setHoveredAspect] = useState<LifeAspect | null>(null)
  const [focusedAspect, setFocusedAspect] = useState<LifeAspect | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Calculate camera target based on focus state
  const cameraTarget = useFocusCamera({ focusedAspect, peaks })

  const handlePeakHover = useCallback(
    (aspect: LifeAspect | null) => {
      setHoveredAspect(aspect)
      onAspectHover?.(aspect)
    },
    [onAspectHover]
  )

  const handlePeakClick = useCallback(
    (aspect: LifeAspect) => {
      if (isAnimating) return // Prevent clicks during animation

      if (focusedAspect === aspect) {
        // Click same peak = unfocus
        setFocusedAspect(null)
      } else {
        // Focus new peak
        setFocusedAspect(aspect)
      }
      onAspectClick?.(aspect)
    },
    [focusedAspect, isAnimating, onAspectClick]
  )

  const handleTerrainClick = useCallback(() => {
    // Click empty terrain = unfocus
    if (focusedAspect && !isAnimating) {
      setFocusedAspect(null)
    }
  }, [focusedAspect, isAnimating])

  const handleUnfocus = useCallback(() => {
    if (!isAnimating) {
      setFocusedAspect(null)
    }
  }, [isAnimating])

  const handleAnimationStart = useCallback(() => {
    setIsAnimating(true)
  }, [])

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false)
  }, [])

  return (
    <div className={cn("w-full h-full relative flex", className)}>
      {/* Detail Panel (shown when focused) */}
      {focusedAspect && (
        <AspectPanel
          aspect={focusedAspect}
          peakData={peaks[focusedAspect]}
          onClose={handleUnfocus}
          onAddTask={() => {
            // Navigate to add task - could be implemented later
            console.log("Add task for", focusedAspect)
          }}
          onViewAll={() => {
            // Navigate to tasks view - could be implemented later
            console.log("View all tasks for", focusedAspect)
          }}
        />
      )}

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          dpr={pixelRatio}
          camera={{ fov: 45, near: 0.1, far: 100, position: [6, 4, 6] }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={<LoadingFallback />}>
            {/* Background gradient (renders behind everything) */}
            <GradientBackground />

            {/* Enhanced lighting with environment map */}
            <SceneLighting />

            {/* Camera with spring animation */}
            <AnimatedCamera
              target={cameraTarget}
              enableControls={true}
              onAnimationComplete={handleAnimationComplete}
            />

            {/* Main terrain with colored peaks */}
            <TerrainMesh
              peaks={peaks}
              segments={terrainSegments}
              hoveredAspect={hoveredAspect}
              focusedAspect={focusedAspect}
              onPeakHover={handlePeakHover}
              onPeakClick={handlePeakClick}
              onTerrainClick={handleTerrainClick}
            />

            {/* Glowing crystals with Float animation */}
            <CrystalField
              peaks={peaks}
              hoveredAspect={hoveredAspect}
              focusedAspect={focusedAspect}
            />

            {/* Task count orbitals */}
            <OrbitalSystem peaks={peaks} maxOrbitals={maxOrbitals} />

            {/* Ambient sparkle particles for atmosphere */}
            <AmbientParticles enabled={enableBloom} />

            {/* Tooltip on hover (only in overview mode) */}
            {hoveredAspect && !focusedAspect && (
              <Html
                position={[
                  PEAK_POSITIONS[hoveredAspect][0],
                  (peaks[hoveredAspect].progress / 100) * 1.5 + 0.8,
                  PEAK_POSITIONS[hoveredAspect][2],
                ]}
                center
                style={{ pointerEvents: "none" }}
              >
                <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg min-w-[120px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ASPECT_CONFIG[hoveredAspect].color }}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {ASPECT_CONFIG[hoveredAspect].label}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Progress: {peaks[hoveredAspect].progress}%</div>
                    <div>Streak: {peaks[hoveredAspect].streak} days</div>
                    <div>Tasks: {peaks[hoveredAspect].taskCount}</div>
                  </div>
                </div>
              </Html>
            )}

            {/* Post-processing effects (bloom, vignette) - disabled on mobile */}
            <PostProcessing enabled={enableBloom} />
          </Suspense>
        </Canvas>

        {/* Interaction hint */}
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground/60">
          {focusedAspect
            ? "Click elsewhere to return"
            : "Click a peak to focus, scroll to zoom"}
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-muted-foreground text-sm">Loading landscape...</div>
    </Html>
  )
}
