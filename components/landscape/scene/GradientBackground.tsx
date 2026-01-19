"use client"

import { useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * Animated gradient background shader.
 * Creates depth and atmosphere instead of transparent/solid background.
 *
 * Uses vertex shader for UV coordinates and fragment shader for:
 * - Vertical gradient from dark to slightly lighter warm tone
 * - Subtle wave animation for organic feel
 * - Noise-based variation for visual interest
 */
export function GradientBackground() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uColor1: { value: new THREE.Color("#0D0C0B") }, // Very dark warm
      uColor2: { value: new THREE.Color("#1C1B1A") }, // Dark warm (from design system)
      uColor3: { value: new THREE.Color("#2A2825") }, // Slightly lighter for variation
      uTime: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime * 0.08
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -15]}
      scale={[viewport.width * 3, viewport.height * 3, 1]}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          uniform float uTime;
          varying vec2 vUv;

          // Simple noise function
          float noise(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
          }

          void main() {
            // Base vertical gradient
            float gradient = vUv.y;

            // Add subtle wave distortion
            gradient += sin(vUv.x * 3.0 + uTime) * 0.03;
            gradient += cos(vUv.y * 2.0 + uTime * 0.7) * 0.02;

            // Smooth gradient transitions
            vec3 color = mix(uColor1, uColor2, smoothstep(0.0, 0.5, gradient));
            color = mix(color, uColor3, smoothstep(0.5, 1.0, gradient));

            // Add subtle noise for texture
            float n = noise(vUv * 100.0 + uTime * 0.1) * 0.02;
            color += n;

            // Radial vignette from center (subtle)
            vec2 center = vUv - 0.5;
            float vignette = 1.0 - length(center) * 0.3;
            color *= vignette;

            gl_FragColor = vec4(color, 1.0);
          }
        `}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
