"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { STARFIELD_CONFIG, SPACE_COLORS } from "../constants"

/**
 * Generate random star positions in a sphere
 */
function generateStarPositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Random point in sphere using spherical coordinates
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = radius * (0.5 + Math.random() * 0.5) // Vary distance

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }

  return positions
}

/**
 * Generate star sizes with some variation
 */
function generateStarSizes(count: number, baseSize: number): Float32Array {
  const sizes = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // Most stars small, few larger
    const random = Math.random()
    if (random > 0.98) {
      sizes[i] = baseSize * 3 // Bright stars
    } else if (random > 0.9) {
      sizes[i] = baseSize * 1.5 // Medium stars
    } else {
      sizes[i] = baseSize * (0.5 + Math.random() * 0.5) // Small stars
    }
  }

  return sizes
}

/**
 * Starfield background component using instanced points
 */
export function Starfield() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, sizes } = useMemo(() => {
    return {
      positions: generateStarPositions(STARFIELD_CONFIG.count, STARFIELD_CONFIG.radius),
      sizes: generateStarSizes(STARFIELD_CONFIG.count, STARFIELD_CONFIG.size),
    }
  }, [])

  // Subtle twinkle animation
  useFrame((state) => {
    if (!pointsRef.current) return

    // Very slow rotation for parallax effect
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.005
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.003) * 0.02
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={SPACE_COLORS.stars}
        size={STARFIELD_CONFIG.size}
        sizeAttenuation={STARFIELD_CONFIG.sizeAttenuation}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Ambient nebula/space dust for depth
 */
export function SpaceAmbience() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.01
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -20]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        color={SPACE_COLORS.nebula}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
