"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { CAMERA_CONFIG, PLANET_POSITIONS } from "../constants"
import type { ZoomLevel } from "../types"

interface CameraControllerProps {
  zoomLevel: ZoomLevel
  focusedPlanet: number | null
  onTransitionComplete?: () => void
}

/**
 * Smooth camera controller for system/planet zoom transitions
 */
export function CameraController({
  zoomLevel,
  focusedPlanet,
  onTransitionComplete,
}: CameraControllerProps) {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3(...CAMERA_CONFIG.system.position))
  const targetLookAt = useRef(new THREE.Vector3(...CAMERA_CONFIG.system.lookAt))
  const currentLookAt = useRef(new THREE.Vector3(...CAMERA_CONFIG.system.lookAt))
  const isTransitioning = useRef(false)

  // Update target based on zoom level
  useEffect(() => {
    isTransitioning.current = true

    if (zoomLevel === "system") {
      // Zoom out to system view
      targetPosition.current.set(...CAMERA_CONFIG.system.position)
      targetLookAt.current.set(...CAMERA_CONFIG.system.lookAt)
    } else if (zoomLevel === "planet" && focusedPlanet !== null) {
      // Zoom in to specific planet
      const planetPos = PLANET_POSITIONS[focusedPlanet]

      // Position camera at angle looking at planet
      const offset = new THREE.Vector3(
        CAMERA_CONFIG.planet.distance * 0.8,
        CAMERA_CONFIG.planet.height,
        CAMERA_CONFIG.planet.distance * 0.6
      )

      targetPosition.current.set(
        planetPos.x + offset.x,
        planetPos.y + offset.y,
        planetPos.z + offset.z
      )
      targetLookAt.current.set(planetPos.x, planetPos.y, planetPos.z)
    }
  }, [zoomLevel, focusedPlanet])

  useFrame((state, delta) => {
    if (!isTransitioning.current) return

    // Smooth camera position lerp
    const lerpFactor = 1 - Math.pow(0.001, delta)

    camera.position.lerp(targetPosition.current, lerpFactor * 3)
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor * 3)
    camera.lookAt(currentLookAt.current)

    // Check if transition is complete
    const positionDist = camera.position.distanceTo(targetPosition.current)
    const lookAtDist = currentLookAt.current.distanceTo(targetLookAt.current)

    if (positionDist < 0.01 && lookAtDist < 0.01) {
      isTransitioning.current = false
      onTransitionComplete?.()
    }
  })

  return null
}

/**
 * Orbit controls wrapper with zoom constraints
 */
export function useZoomControls() {
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = gl.domElement

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomSpeed = 0.5
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)

      const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed
      camera.position.addScaledVector(direction, delta)

      // Clamp zoom range
      const distance = camera.position.length()
      if (distance < 5) {
        camera.position.normalize().multiplyScalar(5)
      } else if (distance > 40) {
        camera.position.normalize().multiplyScalar(40)
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) { // Right or middle mouse
        isDragging.current = true
        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return

      const deltaX = e.clientX - lastMousePos.current.x
      const deltaY = e.clientY - lastMousePos.current.y
      lastMousePos.current = { x: e.clientX, y: e.clientY }

      // Rotate camera around origin
      const rotationSpeed = 0.005
      const spherical = new THREE.Spherical().setFromVector3(camera.position)

      spherical.theta -= deltaX * rotationSpeed
      spherical.phi -= deltaY * rotationSpeed

      // Clamp phi to prevent flipping
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

      camera.position.setFromSpherical(spherical)
      camera.lookAt(0, 0, 0)
    }

    canvas.addEventListener("wheel", handleWheel, { passive: false })
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mouseup", handleMouseUp)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("contextmenu", (e) => e.preventDefault())

    return () => {
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mouseup", handleMouseUp)
      canvas.removeEventListener("mousemove", handleMouseMove)
    }
  }, [camera, gl])

  return null
}
