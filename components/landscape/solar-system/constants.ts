import type { PlanetFill, PlanetPosition } from "./types"

// Month names for display
export const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
]

// Zigzag orbital path positions for 12 planets
// Creates an S-curve/zigzag pattern when connected
// Arranged in a way that flows naturally through space
export const PLANET_POSITIONS: PlanetPosition[] = [
  // Row 1 (Jan-Mar) - Left to right
  { x: -6, y: 0, z: -4 },    // January
  { x: -2, y: 0.5, z: -5 },  // February
  { x: 2, y: 0, z: -4 },     // March

  // Row 2 (Apr-Jun) - Right to left (zigzag back)
  { x: 5, y: -0.3, z: -1 },  // April
  { x: 1, y: 0.2, z: 0 },    // May
  { x: -3, y: -0.2, z: -1 }, // June

  // Row 3 (Jul-Sep) - Left to right again
  { x: -5, y: 0.4, z: 2 },   // July
  { x: -1, y: -0.1, z: 3 },  // August
  { x: 3, y: 0.3, z: 2 },    // September

  // Row 4 (Oct-Dec) - Right to left (final zigzag)
  { x: 6, y: 0, z: 5 },      // October
  { x: 2, y: -0.4, z: 6 },   // November
  { x: -2, y: 0.1, z: 5 },   // December
]

// Planet visual configuration
export const PLANET_CONFIG = {
  baseRadius: 0.6,
  emptyRadius: 0.4,        // Smaller when empty
  thrivingRadius: 0.8,     // Larger when thriving

  // Lighting based on time state
  lighting: {
    current: {
      emissive: 1.5,
      opacity: 1.0,
      saturation: 1.0,
    },
    past: {
      emissive: 0.6,
      opacity: 0.85,
      saturation: 0.7,
    },
    future: {
      emissive: 0.15,
      opacity: 0.4,
      saturation: 0.2,
    },
  },

  // Animation
  rotationSpeed: 0.1,
  hoverScale: 1.15,
  focusScale: 1.3,
}

// Dotted line configuration
export const ORBIT_PATH_CONFIG = {
  dashSize: 0.15,
  gapSize: 0.1,
  lineWidth: 2,
  color: {
    past: "#4a5568",      // Dimmer for past connections
    current: "#718096",   // Medium for current
    future: "#2d3748",    // Very dim for future
  },
  opacity: {
    past: 0.6,
    current: 0.8,
    future: 0.25,
  },
}

// Camera configuration
export const CAMERA_CONFIG = {
  // System view - closer and more angled for prominent planets
  system: {
    position: [2, 6, 10] as [number, number, number],  // Closer, slightly offset
    lookAt: [0, 0, 1] as [number, number, number],     // Look slightly forward
    fov: 55,  // Wider FOV for closer view
  },
  // Planet focus view (zoomed in)
  planet: {
    distance: 3,
    height: 1.8,
    fov: 45,
  },
  // Animation
  transitionDuration: 1.2,
  springConfig: {
    tension: 80,
    friction: 20,
  },
}

// Starfield configuration
export const STARFIELD_CONFIG = {
  count: 800,
  radius: 50,
  size: 0.08,
  sizeAttenuation: true,
}

// Empty planet fill (default)
export const EMPTY_FILL: PlanetFill = {
  tasks: 0,
  goals: 0,
  habits: 0,
  journal: 0,
  events: 0,
  overall: 0,
}

// Mock data for testing
export const MOCK_PLANET_FILLS: Record<number, PlanetFill> = {
  0: { tasks: 0.8, goals: 0.6, habits: 0.9, journal: 0.7, events: 0.5, overall: 0.74 },  // Jan - thriving
  1: { tasks: 0.5, goals: 0.3, habits: 0.6, journal: 0.4, events: 0.3, overall: 0.44 },  // Feb - growing
  2: { tasks: 0.3, goals: 0.2, habits: 0.4, journal: 0.2, events: 0.1, overall: 0.26 },  // Mar - starting
  3: { tasks: 0.1, goals: 0, habits: 0.2, journal: 0.1, events: 0, overall: 0.1 },       // Apr - empty
  // Future months will use EMPTY_FILL or plannedFill
}

// Fill state thresholds
export const FILL_THRESHOLDS = {
  empty: 0,
  starting: 0.01,
  growing: 0.26,
  active: 0.51,
  thriving: 0.76,
}

// Planet colors based on fill state
export const PLANET_COLORS = {
  empty: "#1a1a2e",       // Dark asteroid
  starting: "#2d3436",    // Rocky gray
  growing: "#4a6670",     // Muted teal
  active: "#5d8a66",      // Ocean green
  thriving: "#7cb88c",    // Lush green

  // Glow colors
  atmosphereEmpty: "#000000",
  atmosphereThriving: "#88c0d0",
}

// Space background
export const SPACE_COLORS = {
  background: "#0a0a0f",
  nebula: "#1a1025",
  stars: "#ffffff",
}
