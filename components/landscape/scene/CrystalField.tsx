"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import * as THREE from "three"
import type { LifeAspect } from "@/lib/types"
import type { PeakData } from "../types"
import { PEAK_POSITIONS, CRYSTAL_CONFIG, ASPECT_HEX } from "../constants"
import { useBreathing } from "../hooks/use-breathing"

interface CrystalFieldProps {
  peaks: Record<LifeAspect, PeakData>
  hoveredAspect: LifeAspect | null
  focusedAspect?: LifeAspect | null
}

/**
 * Crystals growing from terrain peaks.
 * Size based on streak length.
 *
 * Enhancements:
 * - Float wrapper for natural hovering motion
 * - High emissive intensity (>1) for bloom pickup
 * - toneMapped={false} critical for selective bloom
 * - Enhanced focus/unfocus contrast
 */
export function CrystalField({ peaks, hoveredAspect, focusedAspect }: CrystalFieldProps) {
  const groupRef = useRef<THREE.Group>(null)
  const crystalRefs = useRef<Map<LifeAspect, THREE.Mesh>>(new Map())
  const breathingRef = useBreathing()

  // Create shared geometry - slightly higher detail for better silhouette
  const geometry = useMemo(() => {
    return new THREE.OctahedronGeometry(1, 1)
  }, [])

  // Calculate crystal scales based on streaks
  const crystalData = useMemo(() => {
    const aspects = Object.keys(PEAK_POSITIONS) as LifeAspect[]
    return aspects.map((aspect) => {
      const { streak, progress } = peaks[aspect]
      const [px, , pz] = PEAK_POSITIONS[aspect]

      // Base scale from streak
      const scale = Math.min(
        CRYSTAL_CONFIG.baseScale + streak * CRYSTAL_CONFIG.streakMultiplier,
        CRYSTAL_CONFIG.maxScale
      )

      // Height above terrain based on progress
      const terrainHeight = (progress / 100) * 1.5 // matches TERRAIN_CONFIG.maxHeight
      const crystalY = terrainHeight + scale * 0.5 + 0.15

      return {
        aspect,
        position: [px, crystalY, pz] as [number, number, number],
        scale,
        color: ASPECT_HEX[aspect],
      }
    })
  }, [peaks])

  // Rotation and breathing animation
  useFrame((state) => {
    const t = state.clock.elapsedTime

    crystalRefs.current.forEach((mesh, aspect) => {
      if (!mesh) return

      const isFocused = focusedAspect === aspect
      const isHovered = hoveredAspect === aspect

      // Slow rotation (faster when focused)
      const rotationSpeed = isFocused
        ? CRYSTAL_CONFIG.rotationSpeed * 3
        : CRYSTAL_CONFIG.rotationSpeed
      mesh.rotation.y = t * rotationSpeed
      mesh.rotation.x = Math.sin(t * 0.5) * 0.15

      // Breathing scale pulse
      const baseScale = crystalData.find((d) => d.aspect === aspect)?.scale || 0.2
      const breathScale = baseScale * breathingRef.current.crystal

      // Scale boost for hovered/focused - more dramatic
      const highlightScale = isFocused ? 1.6 : isHovered ? 1.3 : 1
      mesh.scale.setScalar(breathScale * highlightScale)

      // Update emissive intensity - HIGH values for bloom
      // Focused: very bright glow, Hovered: medium glow, Default: subtle glow
      const material = mesh.material as THREE.MeshStandardMaterial
      if (isFocused) {
        material.emissiveIntensity = CRYSTAL_CONFIG.focusedEmissive
        material.opacity = 1
      } else if (isHovered) {
        material.emissiveIntensity = CRYSTAL_CONFIG.hoveredEmissive
        material.opacity = 0.95
      } else if (focusedAspect) {
        // Dramatically dim non-focused when something else is focused
        material.emissiveIntensity = CRYSTAL_CONFIG.dimmedEmissive
        material.opacity = 0.3
      } else {
        material.emissiveIntensity = CRYSTAL_CONFIG.emissiveIntensity
        material.opacity = 0.9
      }
    })
  })

  return (
    <group ref={groupRef}>
      {crystalData.map(({ aspect, position, scale, color }) => (
        <Float
          key={aspect}
          speed={1.5 + Math.random() * 0.5}
          rotationIntensity={0.3}
          floatIntensity={0.4}
          floatingRange={[-0.05, 0.05]}
        >
          <mesh
            ref={(el) => {
              if (el) crystalRefs.current.set(aspect, el)
            }}
            geometry={geometry}
            position={position}
            scale={scale}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={CRYSTAL_CONFIG.emissiveIntensity}
              roughness={0.15}
              metalness={0.9}
              transparent
              opacity={0.9}
              toneMapped={false}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}
