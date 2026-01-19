"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { LifeAspect } from "@/lib/types"
import type { PeakData } from "../types"
import { TERRAIN_CONFIG, PEAK_POSITIONS, ASPECT_HEX } from "../constants"
import { useBreathing } from "../hooks/use-breathing"

interface TerrainMeshProps {
  peaks: Record<LifeAspect, PeakData>
  segments: number
  hoveredAspect: LifeAspect | null
  focusedAspect?: LifeAspect | null
  onPeakHover: (aspect: LifeAspect | null) => void
  onPeakClick: (aspect: LifeAspect) => void
  onTerrainClick?: () => void
}

/**
 * Low-poly terrain with 6 peaks, one per life aspect.
 * Peak height corresponds to aspect progress (0-100%).
 * Vertex colors from aspect palette.
 */
export function TerrainMesh({
  peaks,
  segments,
  hoveredAspect,
  focusedAspect,
  onPeakHover,
  onPeakClick,
  onTerrainClick,
}: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const breathingRef = useBreathing()

  // Generate terrain geometry with displaced peaks
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_CONFIG.size,
      TERRAIN_CONFIG.size,
      segments,
      segments
    )

    // Rotate to horizontal
    geo.rotateX(-Math.PI / 2)

    const positions = geo.attributes.position
    const colors = new Float32Array(positions.count * 3)

    // Default color (dark gray base)
    const baseColor = new THREE.Color("#3D3D3D")

    // For each vertex, calculate height and color
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)

      let height = TERRAIN_CONFIG.baseHeight
      let vertexColor = baseColor.clone()
      let maxInfluence = 0

      // Calculate influence from each peak
      const aspects = Object.keys(PEAK_POSITIONS) as LifeAspect[]
      for (const aspect of aspects) {
        const [px, , pz] = PEAK_POSITIONS[aspect]
        const distance = Math.sqrt((x - px) ** 2 + (z - pz) ** 2)
        const radius = TERRAIN_CONFIG.peakRadius

        if (distance < radius) {
          const progress = peaks[aspect].progress / 100
          const influence = Math.cos((distance / radius) * Math.PI * 0.5) ** 2
          const peakHeight = progress * TERRAIN_CONFIG.maxHeight

          // Add height contribution
          height += peakHeight * influence

          // Blend color based on influence
          if (influence > maxInfluence) {
            maxInfluence = influence
            const aspectColor = new THREE.Color(ASPECT_HEX[aspect])
            vertexColor.lerp(aspectColor, influence * 0.8)
          }
        }
      }

      // Add subtle noise for organic feel
      height += (Math.random() - 0.5) * TERRAIN_CONFIG.noiseScale

      positions.setY(i, height)
      colors[i * 3] = vertexColor.r
      colors[i * 3 + 1] = vertexColor.g
      colors[i * 3 + 2] = vertexColor.b
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    return geo
  }, [peaks, segments])

  // Breathing animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y = breathingRef.current.terrain
    }
  })

  // Handle pointer events for peak detection
  const handlePointerMove = (e: THREE.Intersection) => {
    const point = e.point
    let closestAspect: LifeAspect | null = null
    let closestDistance = TERRAIN_CONFIG.peakRadius

    const aspects = Object.keys(PEAK_POSITIONS) as LifeAspect[]
    for (const aspect of aspects) {
      const [px, , pz] = PEAK_POSITIONS[aspect]
      const distance = Math.sqrt((point.x - px) ** 2 + (point.z - pz) ** 2)
      if (distance < closestDistance) {
        closestDistance = distance
        closestAspect = aspect
      }
    }

    onPeakHover(closestAspect)
  }

  const handleClick = (e: THREE.Intersection) => {
    const point = e.point
    const aspects = Object.keys(PEAK_POSITIONS) as LifeAspect[]

    for (const aspect of aspects) {
      const [px, , pz] = PEAK_POSITIONS[aspect]
      const distance = Math.sqrt((point.x - px) ** 2 + (point.z - pz) ** 2)
      if (distance < TERRAIN_CONFIG.peakRadius) {
        onPeakClick(aspect)
        return
      }
    }

    // Clicked terrain but not on any peak
    onTerrainClick?.()
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerMove={(e) => {
        e.stopPropagation()
        handlePointerMove(e)
      }}
      onPointerLeave={() => onPeakHover(null)}
      onClick={(e) => {
        e.stopPropagation()
        handleClick(e)
      }}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.8}
        metalness={0.1}
        flatShading
      />
    </mesh>
  )
}
