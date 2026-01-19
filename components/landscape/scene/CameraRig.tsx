"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { CAMERA_CONFIG } from "../constants"

interface CameraRigProps {
  enableControls?: boolean
}

/**
 * Camera setup with optional orbit controls.
 * Provides angled perspective view of the terrain.
 */
export function CameraRig({ enableControls = false }: CameraRigProps) {
  const { camera } = useThree()
  const initialized = useRef(false)

  // Set initial camera position once
  useFrame(() => {
    if (!initialized.current) {
      camera.position.set(...CAMERA_CONFIG.position)
      camera.lookAt(0, 0, 0)
      initialized.current = true
    }
  })

  // Subtle auto-rotation when not controlled
  useFrame((state) => {
    if (!enableControls) {
      const t = state.clock.elapsedTime * 0.05
      const radius = Math.sqrt(
        CAMERA_CONFIG.position[0] ** 2 + CAMERA_CONFIG.position[2] ** 2
      )
      camera.position.x = Math.cos(t) * radius
      camera.position.z = Math.sin(t) * radius
      camera.lookAt(0, 0, 0)
    }
  })

  if (enableControls) {
    return (
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 0, 0]}
      />
    )
  }

  return null
}
