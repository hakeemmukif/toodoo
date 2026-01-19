"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import * as THREE from "three"
import { PLANET_POSITIONS, ORBIT_PATH_CONFIG } from "../constants"
import type { TimeState } from "../types"

interface OrbitPathProps {
  currentMonth: number // 0-11
}

/**
 * Get time state for a path segment based on which months it connects
 */
function getSegmentTimeState(fromMonth: number, toMonth: number, currentMonth: number): TimeState {
  if (fromMonth > currentMonth || toMonth > currentMonth) return "future"
  if (toMonth === currentMonth) return "current"
  return "past"
}

/**
 * Single line segment between two planets
 */
function PathSegment({
  from,
  to,
  timeState,
}: {
  from: [number, number, number]
  to: [number, number, number]
  timeState: TimeState
}) {
  const color = ORBIT_PATH_CONFIG.color[timeState]
  const opacity = ORBIT_PATH_CONFIG.opacity[timeState]

  return (
    <Line
      points={[from, to]}
      color={color}
      lineWidth={1.5}
      transparent
      opacity={opacity}
      dashed
      dashSize={0.2}
      gapSize={0.15}
    />
  )
}

/**
 * Animated pulse effect on the current position
 */
function PulseIndicator({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const scale = 0.08 + Math.sin(state.clock.elapsedTime * 3) * 0.02
    meshRef.current.scale.setScalar(scale)
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#f0c674" transparent opacity={0.9} />
    </mesh>
  )
}

/**
 * The zigzag orbit path connecting all 12 planets
 */
export function OrbitPath({ currentMonth }: OrbitPathProps) {
  const segments = useMemo(() => {
    const result: { from: [number, number, number]; to: [number, number, number]; timeState: TimeState }[] = []

    for (let i = 0; i < 11; i++) {
      const from = PLANET_POSITIONS[i]
      const to = PLANET_POSITIONS[i + 1]

      result.push({
        from: [from.x, from.y, from.z],
        to: [to.x, to.y, to.z],
        timeState: getSegmentTimeState(i, i + 1, currentMonth),
      })
    }

    return result
  }, [currentMonth])

  const currentIndicatorPosition = useMemo<[number, number, number]>(() => {
    if (currentMonth === 0) {
      const pos = PLANET_POSITIONS[0]
      return [pos.x - 0.8, pos.y, pos.z]
    }

    const prevPos = PLANET_POSITIONS[currentMonth - 1]
    const currPos = PLANET_POSITIONS[currentMonth]

    // 70% along the path to current month
    return [
      prevPos.x + (currPos.x - prevPos.x) * 0.7,
      prevPos.y + (currPos.y - prevPos.y) * 0.7,
      prevPos.z + (currPos.z - prevPos.z) * 0.7,
    ]
  }, [currentMonth])

  return (
    <group>
      {segments.map((segment, index) => (
        <PathSegment
          key={index}
          from={segment.from}
          to={segment.to}
          timeState={segment.timeState}
        />
      ))}
      <PulseIndicator position={currentIndicatorPosition} />
    </group>
  )
}
