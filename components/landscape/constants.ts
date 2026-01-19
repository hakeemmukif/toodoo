import type { LifeAspect } from "@/lib/types"
import type { PeakData } from "./types"

// Peak positions in hexagonal layout (x, y, z)
export const PEAK_POSITIONS: Record<LifeAspect, [number, number, number]> = {
  fitness:        [-1.8, 0, -1.2],
  nutrition:      [1.8, 0, -1.2],
  career:         [-2.5, 0, 0.8],
  financial:      [2.5, 0, 0.8],
  "side-projects": [-0.8, 0, 2.0],
  chores:         [0.8, 0, 2.0],
}

// Pre-computed hex colors from OKLCH values in lib/constants.ts
export const ASPECT_HEX: Record<LifeAspect, string> = {
  fitness:        "#C4726C",
  nutrition:      "#7D9B76",
  career:         "#6B7B8C",
  financial:      "#B8A068",
  "side-projects": "#8B7B8E",
  chores:         "#9B9590",
}

// Mock data for testing visualization
export const MOCK_LANDSCAPE_DATA: Record<LifeAspect, PeakData> = {
  fitness:        { aspect: "fitness", progress: 75, streak: 12, taskCount: 3 },
  nutrition:      { aspect: "nutrition", progress: 45, streak: 5, taskCount: 2 },
  career:         { aspect: "career", progress: 60, streak: 8, taskCount: 4 },
  financial:      { aspect: "financial", progress: 30, streak: 2, taskCount: 1 },
  "side-projects": { aspect: "side-projects", progress: 85, streak: 15, taskCount: 5 },
  chores:         { aspect: "chores", progress: 50, streak: 3, taskCount: 2 },
}

// Terrain configuration
export const TERRAIN_CONFIG = {
  size: 8,
  segments: 32,
  mobileSegments: 16,
  peakRadius: 1.2,
  maxHeight: 1.5,
  baseHeight: -0.3,
  noiseScale: 0.15,
}

// Crystal configuration
// emissive values > 1 are picked up by bloom post-processing
export const CRYSTAL_CONFIG = {
  baseScale: 0.15,
  streakMultiplier: 0.025,
  maxScale: 0.55,
  emissiveIntensity: 2.0,      // Base glow (picked up by bloom)
  focusedEmissive: 4.0,        // Bright glow when focused
  hoveredEmissive: 3.0,        // Medium glow on hover
  dimmedEmissive: 0.3,         // Dimmed when other crystal is focused
  rotationSpeed: 0.4,
}

// Orbital configuration
export const ORBITAL_CONFIG = {
  baseRadius: 0.05,
  orbitRadius: 0.9,
  orbitSpeed: 0.5,
  maxParticles: 60,
  mobileMaxParticles: 25,
  emissiveIntensity: 1.5,     // For bloom pickup
}

// Animation configuration
// Increased amplitudes for more noticeable breathing effect
export const ANIMATION_CONFIG = {
  breathing: {
    terrain: { amplitude: 0.025, frequency: 0.2 },
    crystal: { amplitude: 0.08, frequency: 0.3 },
    orbital: { amplitude: 0.04, frequency: 0.45 },
  },
}

// Camera configuration
export const CAMERA_CONFIG = {
  position: [6, 4, 6] as [number, number, number],
  fov: 45,
  near: 0.1,
  far: 100,
}

// Focus mode configuration (click-to-zoom on peaks)
export const FOCUS_CONFIG = {
  cameraDistance: 3.5,      // Distance from peak when focused
  cameraHeight: 2.5,        // Height above terrain when focused
  cameraAngle: Math.PI / 6, // Horizontal angle offset (30 degrees)
  springTension: 120,       // react-spring tension (higher = faster)
  springFriction: 22,       // react-spring friction (higher = less bouncy)
  panelWidth: 300,          // Width of the detail panel in pixels
}
