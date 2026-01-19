import * as THREE from "three"

/**
 * Calculate smooth falloff for peak influence.
 * Uses cosine curve for natural-looking hills.
 */
export function calculatePeakInfluence(distance: number, radius: number): number {
  if (distance >= radius) return 0
  return Math.cos((distance / radius) * Math.PI * 0.5) ** 2
}

/**
 * Generate low-poly noise for terrain variation.
 */
export function generateTerrainNoise(x: number, z: number, scale: number): number {
  // Simple pseudo-random based on position
  const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453
  return (seed - Math.floor(seed) - 0.5) * scale
}

/**
 * Dispose of Three.js resources properly.
 */
export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose()
}

export function disposeMaterial(
  material: THREE.Material | THREE.Material[]
): void {
  if (Array.isArray(material)) {
    material.forEach((m) => m.dispose())
  } else {
    material.dispose()
  }
}
