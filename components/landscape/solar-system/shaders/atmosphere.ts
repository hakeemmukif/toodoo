"use client"

import * as THREE from "three"

/**
 * Fresnel atmosphere shader for planet glow effects.
 * Creates a realistic edge glow that intensifies where the surface
 * curves away from the viewer (Fresnel effect).
 */

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  uniform vec3 glowColor;
  uniform float glowIntensity;
  uniform float glowPower;
  uniform float opacity;

  void main() {
    vec3 viewDir = normalize(vViewPosition);

    // Fresnel calculation - stronger glow at edges
    float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), glowPower);

    // Apply intensity and color
    vec3 glow = glowColor * fresnel * glowIntensity;

    // Final alpha combines fresnel with base opacity
    float alpha = fresnel * opacity;

    gl_FragColor = vec4(glow, alpha);
  }
`

/**
 * Creates a Fresnel atmosphere shader material.
 *
 * @param color - The glow color (hex string or THREE.Color)
 * @param intensity - Glow brightness multiplier (0-3, default 1.5)
 * @param power - Fresnel falloff exponent (1-5, default 2.0)
 * @param opacity - Base opacity (0-1, default 0.6)
 */
export function createAtmosphereMaterial(
  color: string | THREE.Color,
  intensity: number = 1.5,
  power: number = 2.0,
  opacity: number = 0.6
): THREE.ShaderMaterial {
  const glowColor = typeof color === "string" ? new THREE.Color(color) : color

  return new THREE.ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      glowColor: { value: glowColor },
      glowIntensity: { value: intensity },
      glowPower: { value: power },
      opacity: { value: opacity },
    },
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

/**
 * Atmosphere colors based on fill state.
 * More active planets have brighter, warmer atmospheres.
 */
export const ATMOSPHERE_COLORS = {
  empty: "#1a1a2e",      // Barely visible
  starting: "#2d3748",   // Cool gray
  growing: "#4a6670",    // Teal-gray
  active: "#5d8a66",     // Green-teal
  thriving: "#88c0d0",   // Bright cyan
  current: "#f0c674",    // Golden highlight for current month
}

/**
 * Atmosphere intensity based on fill state.
 */
export const ATMOSPHERE_INTENSITY = {
  empty: 0.2,
  starting: 0.5,
  growing: 0.8,
  active: 1.2,
  thriving: 1.8,
}

/**
 * Get atmosphere configuration based on fill state and time state.
 */
export function getAtmosphereConfig(
  fillState: "empty" | "starting" | "growing" | "active" | "thriving",
  isCurrent: boolean,
  isFuture: boolean
): {
  color: string
  intensity: number
  power: number
  opacity: number
  scale: number
} {
  // Future months have minimal atmosphere
  if (isFuture) {
    return {
      color: ATMOSPHERE_COLORS.empty,
      intensity: 0.1,
      power: 3.0,
      opacity: 0.2,
      scale: 1.05,
    }
  }

  // Current month gets golden glow
  if (isCurrent) {
    return {
      color: ATMOSPHERE_COLORS.current,
      intensity: ATMOSPHERE_INTENSITY[fillState] * 1.2,
      power: 2.0,
      opacity: 0.7,
      scale: 1.15 + (ATMOSPHERE_INTENSITY[fillState] * 0.1),
    }
  }

  // Past months based on activity
  return {
    color: ATMOSPHERE_COLORS[fillState],
    intensity: ATMOSPHERE_INTENSITY[fillState],
    power: 2.5,
    opacity: 0.5,
    scale: 1.1 + (ATMOSPHERE_INTENSITY[fillState] * 0.08),
  }
}
