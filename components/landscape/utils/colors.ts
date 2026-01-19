import * as THREE from "three"
import type { LifeAspect } from "@/lib/types"
import { ASPECT_HEX } from "../constants"

// Pre-computed Three.js colors for performance
const colorCache: Map<string, THREE.Color> = new Map()

export function getAspectColor(aspect: LifeAspect): THREE.Color {
  const cached = colorCache.get(aspect)
  if (cached) return cached.clone()

  const color = new THREE.Color(ASPECT_HEX[aspect])
  colorCache.set(aspect, color)
  return color.clone()
}

export function getAspectColorBrightened(aspect: LifeAspect, factor: number = 1.3): THREE.Color {
  const color = getAspectColor(aspect)
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  color.setHSL(hsl.h, hsl.s, Math.min(1, hsl.l * factor))
  return color
}

export function lerpColor(from: THREE.Color, to: THREE.Color, t: number): THREE.Color {
  return from.clone().lerp(to, t)
}

// Background colors for scene
export const SCENE_COLORS = {
  background: new THREE.Color("#1C1B1A"),      // Dark mode background
  backgroundLight: new THREE.Color("#FAF9F7"), // Light mode background
  fog: new THREE.Color("#1C1B1A"),
  ambient: new THREE.Color("#FAF9F7"),
}
