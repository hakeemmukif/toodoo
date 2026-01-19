"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { PlanetFill } from "../types"

interface RingsProps {
  radius: number
  fill: PlanetFill
  isCurrent: boolean
  isFuture: boolean
}

/**
 * Ring configuration based on goal achievement
 */
const RING_CONFIG = {
  // Minimum goal fill to show first ring
  thresholds: [0.25, 0.50, 0.75],

  // Ring appearance
  innerOffset: 1.4,    // First ring starts at radius * 1.4
  outerOffset: 1.55,   // First ring ends at radius * 1.55
  ringGap: 0.15,       // Gap between multiple rings
  ringWidth: 0.12,     // Width of each ring

  // Colors
  colors: {
    base: "#5d8a66",       // Green for active rings
    highlight: "#88c0d0",  // Cyan for thriving
    current: "#f0c674",    // Gold for current month
    dim: "#2d3748",        // Dim for low achievement
  },

  // Animation
  rotationSpeed: 0.15,
  wobbleAmplitude: 0.02,
}

/**
 * Determine number of rings based on goal achievement
 */
function getRingCount(goalFill: number): number {
  if (goalFill >= 0.75) return 3  // Three rings for 75%+ goals
  if (goalFill >= 0.50) return 2  // Two rings for 50%+
  if (goalFill >= 0.25) return 1  // One ring for 25%+
  return 0  // No rings below 25%
}

/**
 * Get ring color based on achievement level
 */
function getRingColor(index: number, totalRings: number, isCurrent: boolean): string {
  if (isCurrent) return RING_CONFIG.colors.current

  // Outer rings are brighter
  if (index === totalRings - 1 && totalRings >= 2) {
    return RING_CONFIG.colors.highlight
  }

  return RING_CONFIG.colors.base
}

/**
 * Achievement rings component - shows Saturn-like rings for goal completion
 */
export function Rings({ radius, fill, isCurrent, isFuture }: RingsProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Don't show rings for future months
  if (isFuture) return null

  const ringCount = getRingCount(fill.goals)

  // No rings if below threshold
  if (ringCount === 0) return null

  // Animation
  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Slow rotation
    groupRef.current.rotation.z += delta * RING_CONFIG.rotationSpeed

    // Subtle wobble
    const wobble = Math.sin(state.clock.elapsedTime * 0.5) * RING_CONFIG.wobbleAmplitude
    groupRef.current.rotation.x = Math.PI / 2 + wobble
  })

  // Generate ring geometries
  const rings = useMemo(() => {
    const result = []

    for (let i = 0; i < ringCount; i++) {
      const innerRadius = radius * (RING_CONFIG.innerOffset + i * (RING_CONFIG.ringWidth + RING_CONFIG.ringGap))
      const outerRadius = innerRadius + radius * RING_CONFIG.ringWidth

      result.push({
        key: `ring-${i}`,
        innerRadius,
        outerRadius,
        color: getRingColor(i, ringCount, isCurrent),
        opacity: 0.6 + (i * 0.15), // Outer rings more opaque
      })
    }

    return result
  }, [radius, ringCount, isCurrent])

  return (
    <group ref={groupRef} rotation={[Math.PI / 2, 0, 0]}>
      {rings.map((ring) => (
        <mesh key={ring.key}>
          <ringGeometry args={[ring.innerRadius, ring.outerRadius, 64]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Small orbiting moons for high achievement planets
 * Shows when habits are very strong (>80%)
 */
interface MoonsProps {
  radius: number
  fill: PlanetFill
  isFuture: boolean
}

export function Moons({ radius, fill, isFuture }: MoonsProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Only show moons for high habit achievement
  if (isFuture || fill.habits < 0.8) return null

  const moonCount = fill.habits >= 0.95 ? 2 : 1

  // Animation
  useFrame((state) => {
    if (!groupRef.current) return

    // Orbit around planet
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: moonCount }).map((_, i) => {
        const angle = (i / moonCount) * Math.PI * 2
        const distance = radius * 2
        const moonRadius = radius * 0.15

        return (
          <mesh
            key={`moon-${i}`}
            position={[
              Math.cos(angle) * distance,
              0,
              Math.sin(angle) * distance,
            ]}
          >
            <sphereGeometry args={[moonRadius, 8, 8]} />
            <meshStandardMaterial
              color="#a0aec0"
              emissive="#718096"
              emissiveIntensity={0.3}
              roughness={0.8}
            />
          </mesh>
        )
      })}
    </group>
  )
}
