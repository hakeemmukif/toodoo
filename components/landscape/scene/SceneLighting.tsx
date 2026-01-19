"use client"

import { Environment } from "@react-three/drei"

/**
 * Enhanced scene lighting setup.
 *
 * Improvements:
 * - Environment map for realistic reflections on crystals
 * - Rim light for silhouette definition
 * - Warmer color temperatures for depth
 * - Stronger contrast between key and fill lights
 */
export function SceneLighting() {
  return (
    <>
      {/* Environment map for subtle reflections (night preset = subtle, not overpowering) */}
      <Environment preset="night" background={false} />

      {/* Soft ambient for overall base illumination */}
      <ambientLight intensity={0.4} color="#FAF9F7" />

      {/* Main key light (warm sun-like) */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        color="#FFF8E7"
        castShadow={false}
      />

      {/* Fill light from opposite side (cooler tone) */}
      <directionalLight
        position={[-4, 6, -4]}
        intensity={0.4}
        color="#E0E8F0"
      />

      {/* Rim light from behind for silhouette definition */}
      <directionalLight
        position={[0, 3, -8]}
        intensity={0.6}
        color="#B8A068"
      />

      {/* Low warm light from below for ground bounce simulation */}
      <pointLight
        position={[0, -2, 0]}
        intensity={0.3}
        color="#C4726C"
        distance={10}
        decay={2}
      />

      {/* Hemisphere light for natural sky/ground color blend */}
      <hemisphereLight args={["#E8E4DF", "#1C1B1A", 0.5]} />
    </>
  )
}
