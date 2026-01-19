"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { LifeAspect } from "@/lib/types"
import type { PeakData } from "../types"
import { PEAK_POSITIONS, ORBITAL_CONFIG, ASPECT_HEX } from "../constants"
import { useBreathing } from "../hooks/use-breathing"

interface OrbitalSystemProps {
  peaks: Record<LifeAspect, PeakData>
  maxOrbitals: number
}

interface OrbitalParticle {
  aspect: LifeAspect
  index: number
  orbitOffset: number
  orbitHeight: number
  speed: number
}

/**
 * Floating particles orbiting around peaks.
 * Count based on pending tasks per aspect.
 * Uses instanced mesh for performance.
 */
export function OrbitalSystem({ peaks, maxOrbitals }: OrbitalSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const breathingRef = useBreathing()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate particle data
  const particles = useMemo(() => {
    const result: OrbitalParticle[] = []
    const aspects = Object.keys(PEAK_POSITIONS) as LifeAspect[]
    let totalCount = 0

    for (const aspect of aspects) {
      const { taskCount } = peaks[aspect]
      const particlesForAspect = Math.min(taskCount, Math.floor(maxOrbitals / 6))

      for (let i = 0; i < particlesForAspect && totalCount < maxOrbitals; i++) {
        result.push({
          aspect,
          index: i,
          orbitOffset: (i / particlesForAspect) * Math.PI * 2,
          orbitHeight: 0.3 + Math.random() * 0.4,
          speed: ORBITAL_CONFIG.orbitSpeed * (0.8 + Math.random() * 0.4),
        })
        totalCount++
      }
    }

    return result
  }, [peaks, maxOrbitals])

  // Create shared geometry
  const geometry = useMemo(() => {
    return new THREE.SphereGeometry(ORBITAL_CONFIG.baseRadius, 8, 6)
  }, [])

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return

    const t = state.clock.elapsedTime

    particles.forEach((particle, idx) => {
      const { aspect, orbitOffset, orbitHeight, speed } = particle
      const [px, , pz] = PEAK_POSITIONS[aspect]
      const progress = peaks[aspect].progress / 100
      const terrainHeight = progress * 1.5

      // Orbital motion
      const angle = t * speed + orbitOffset
      const radius = ORBITAL_CONFIG.orbitRadius + Math.sin(t * 2 + orbitOffset) * 0.1

      // Position
      dummy.position.set(
        px + Math.cos(angle) * radius,
        terrainHeight + orbitHeight + Math.sin(t * 3 + orbitOffset) * 0.1,
        pz + Math.sin(angle) * radius
      )

      // Scale with breathing
      const scale = breathingRef.current.orbital
      dummy.scale.setScalar(scale)

      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(idx, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Set initial colors
  useMemo(() => {
    if (!meshRef.current) return

    const color = new THREE.Color()
    particles.forEach((particle, idx) => {
      color.set(ASPECT_HEX[particle.aspect])
      meshRef.current!.setColorAt(idx, color)
    })

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [particles])

  if (particles.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, particles.length]}
    >
      <meshStandardMaterial
        vertexColors
        emissive="#FFFFFF"
        emissiveIntensity={ORBITAL_CONFIG.emissiveIntensity}
        roughness={0.3}
        metalness={0.7}
        transparent
        opacity={0.85}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
