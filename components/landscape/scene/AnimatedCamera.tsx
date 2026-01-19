"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { useSpring } from "@react-spring/three"
import * as THREE from "three"
import type { OrbitControls as OrbitControlsType } from "three-stdlib"
import type { CameraTarget } from "../hooks/use-focus-camera"
import { FOCUS_CONFIG } from "../constants"

interface AnimatedCameraProps {
  target: CameraTarget
  enableControls?: boolean
  onAnimationComplete?: () => void
}

/**
 * Animated camera with spring transitions between positions.
 *
 * Uses @react-spring/three for smooth camera movement when switching
 * between overview and focused states. OrbitControls are temporarily
 * disabled during animation to prevent fighting between user input
 * and the animation system.
 */
export function AnimatedCamera({
  target,
  enableControls = true,
  onAnimationComplete,
}: AnimatedCameraProps) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsType>(null)
  const isAnimatingRef = useRef(false)
  const targetVec = useRef(new THREE.Vector3())

  // Spring animation for camera position
  const [springs] = useSpring(
    () => ({
      position: target.position,
      lookAt: target.lookAt,
      config: {
        tension: FOCUS_CONFIG.springTension,
        friction: FOCUS_CONFIG.springFriction,
      },
      onStart: () => {
        isAnimatingRef.current = true
        // Disable controls during animation
        if (controlsRef.current) {
          controlsRef.current.enabled = false
        }
      },
      onRest: () => {
        isAnimatingRef.current = false
        // Re-enable controls and update target
        if (controlsRef.current) {
          controlsRef.current.target.set(...target.lookAt)
          controlsRef.current.enabled = enableControls
          controlsRef.current.update()
        }
        onAnimationComplete?.()
      },
    }),
    [target.position, target.lookAt, enableControls]
  )

  // Apply spring values to camera each frame
  useFrame(() => {
    if (isAnimatingRef.current) {
      const pos = springs.position.get()
      const lookAt = springs.lookAt.get()

      camera.position.set(pos[0], pos[1], pos[2])
      targetVec.current.set(lookAt[0], lookAt[1], lookAt[2])
      camera.lookAt(targetVec.current)
    }
  })

  // Initial camera setup
  useEffect(() => {
    camera.position.set(...target.position)
    targetVec.current.set(...target.lookAt)
    camera.lookAt(targetVec.current)
  }, [])

  if (enableControls) {
    return (
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={15}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.2}
        target={target.lookAt}
      />
    )
  }

  return null
}
