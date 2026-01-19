"use client"

import { useRef, useMemo, useState, Suspense, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"
import type { PlanetData, TimeState } from "../types"
import { PLANET_CONFIG, PLANET_POSITIONS, PLANET_COLORS } from "../constants"
import { createAtmosphereMaterial, getAtmosphereConfig } from "../shaders/atmosphere"
import { Rings, Moons } from "./Rings"

/**
 * Get fill state label from overall fill value
 */
function getFillState(overall: number): "empty" | "starting" | "growing" | "active" | "thriving" {
  if (overall < 0.01) return "empty"
  if (overall < 0.26) return "starting"
  if (overall < 0.51) return "growing"
  if (overall < 0.76) return "active"
  return "thriving"
}

/**
 * LOD segment counts for different detail levels
 */
const LOD_SEGMENTS = {
  high: 48,    // Close-up view
  medium: 24,  // Mid-distance
  low: 12,     // Far away / system view
}

interface PlanetProps {
  data: PlanetData
  isFocused: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (hovered: boolean) => void
}

/**
 * Get time state from planet data
 */
function getTimeState(data: PlanetData): TimeState {
  if (data.isCurrent) return "current"
  if (data.isPast) return "past"
  return "future"
}

/**
 * Get planet color based on fill state and time
 */
function getPlanetColor(fillState: string, timeState: TimeState): string {
  const baseColor = PLANET_COLORS[fillState as keyof typeof PLANET_COLORS] || PLANET_COLORS.empty

  // Future months are greyed out
  if (timeState === "future") {
    return "#1a1a2e" // Dark grey
  }

  return baseColor
}

/**
 * Get emissive intensity based on time state
 */
function getEmissiveIntensity(timeState: TimeState, isHovered: boolean, isFocused: boolean): number {
  const base = PLANET_CONFIG.lighting[timeState].emissive

  if (isFocused) return base * 2
  if (isHovered) return base * 1.5
  return base
}

/**
 * Individual Planet component with Fresnel atmosphere and LOD
 */
export function Planet({ data, isFocused, isHovered, onClick, onHover }: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const [localHover, setLocalHover] = useState(false)

  const position = PLANET_POSITIONS[data.monthIndex]
  const timeState = getTimeState(data)
  const fillState = getFillState(data.fill.overall)

  // Calculate visual properties
  const { color, emissive, radius, opacity, atmosphereConfig } = useMemo(() => {
    const fillProgress = data.fill.overall

    // Radius scales with fill
    const radiusRange = PLANET_CONFIG.thrivingRadius - PLANET_CONFIG.emptyRadius
    const calculatedRadius = PLANET_CONFIG.emptyRadius + radiusRange * fillProgress

    // Get atmosphere config from new shader system
    const atmoConfig = getAtmosphereConfig(fillState, data.isCurrent, data.isFuture)

    return {
      color: getPlanetColor(fillState, timeState),
      emissive: getEmissiveIntensity(timeState, isHovered || localHover, isFocused),
      radius: calculatedRadius,
      opacity: PLANET_CONFIG.lighting[timeState].opacity,
      atmosphereConfig: atmoConfig,
    }
  }, [data, timeState, fillState, isHovered, localHover, isFocused])

  // Create/update atmosphere material
  const atmosphereMaterial = useMemo(() => {
    const material = createAtmosphereMaterial(
      atmosphereConfig.color,
      atmosphereConfig.intensity,
      atmosphereConfig.power,
      atmosphereConfig.opacity
    )
    atmosphereMaterialRef.current = material
    return material
  }, [atmosphereConfig.color, atmosphereConfig.intensity, atmosphereConfig.power, atmosphereConfig.opacity])

  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      atmosphereMaterialRef.current?.dispose()
    }
  }, [])

  // Animation
  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return

    // Slow rotation
    meshRef.current.rotation.y += delta * PLANET_CONFIG.rotationSpeed

    // Hover/focus scale animation on the group
    const targetScale = isFocused
      ? PLANET_CONFIG.focusScale
      : isHovered || localHover
        ? PLANET_CONFIG.hoverScale
        : 1

    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    )

    // Atmosphere pulse for current month with Fresnel
    if (atmosphereRef.current && atmosphereMaterialRef.current) {
      if (data.isCurrent) {
        // Golden pulse for current month
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 1
        atmosphereRef.current.scale.setScalar(atmosphereConfig.scale * pulse)

        // Intensity pulse
        const intensityPulse = atmosphereConfig.intensity * (0.9 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2)
        atmosphereMaterialRef.current.uniforms.glowIntensity.value = intensityPulse
      } else if (isHovered || localHover || isFocused) {
        // Brighten on hover/focus
        const hoverIntensity = atmosphereConfig.intensity * (isFocused ? 1.5 : 1.3)
        atmosphereMaterialRef.current.uniforms.glowIntensity.value = hoverIntensity
      } else {
        // Reset to default
        atmosphereMaterialRef.current.uniforms.glowIntensity.value = atmosphereConfig.intensity
      }
    }
  })

  // For future months with planned data, show ghost outline
  const showPlannedOutline = data.isFuture && data.plannedFill && data.plannedFill.overall > 0

  // Use medium LOD for all planets (system view default)
  // LOD could be made dynamic based on camera distance if needed
  const segments = LOD_SEGMENTS.medium

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Main planet sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setLocalHover(true)
          onHover(true)
          document.body.style.cursor = "pointer"
        }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setLocalHover(false)
          onHover(false)
          document.body.style.cursor = "auto"
        }}
      >
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissive}
          transparent={opacity < 1}
          opacity={opacity}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Fresnel atmosphere glow - always present but varies in intensity */}
      <mesh ref={atmosphereRef} scale={atmosphereConfig.scale}>
        <sphereGeometry args={[radius, segments, segments]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      {/* Planned outline for future months */}
      {showPlannedOutline && (
        <mesh>
          <sphereGeometry args={[radius * 1.1, LOD_SEGMENTS.low, LOD_SEGMENTS.low]} />
          <meshBasicMaterial
            color="#3d5a80"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}

      {/* Current month indicator ring */}
      {data.isCurrent && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.3, radius * 1.35, 48]} />
          <meshBasicMaterial
            color="#f0c674"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Goal achievement rings */}
      <Rings
        radius={radius}
        fill={data.fill}
        isCurrent={data.isCurrent}
        isFuture={data.isFuture}
      />

      {/* Habit achievement moons */}
      <Moons
        radius={radius}
        fill={data.fill}
        isFuture={data.isFuture}
      />

      {/* Month label */}
      <Suspense fallback={null}>
        <Text
          position={[0, -radius - 0.4, 0]}
          fontSize={0.25}
          color={timeState === "future" ? "#4a5568" : "#a0aec0"}
          anchorX="center"
          anchorY="top"
        >
          {data.monthName.substring(0, 3)}
        </Text>
      </Suspense>

      {/* Fill percentage for non-future months */}
      {!data.isFuture && data.fill.overall > 0 && (
        <Suspense fallback={null}>
          <Text
            position={[0, radius + 0.3, 0]}
            fontSize={0.18}
            color={data.isCurrent ? "#f0c674" : "#718096"}
            anchorX="center"
            anchorY="bottom"
          >
            {Math.round(data.fill.overall * 100)}%
          </Text>
        </Suspense>
      )}
    </group>
  )
}
