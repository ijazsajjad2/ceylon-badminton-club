import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const FEATHER_COUNT = 14

// A stylised badminton shuttlecock built from primitives (no external model
// asset needed): a rounded cork base + a flared "skirt" cone + a ring of
// individual thin feather blades so it reads as a shuttlecock, not a cone.
function Shuttlecock({ reduceMotion }) {
  const group = useRef(null)
  const feathers = useMemo(
    () => Array.from({ length: FEATHER_COUNT }, (_, i) => (i / FEATHER_COUNT) * Math.PI * 2),
    []
  )

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    if (!reduceMotion) g.rotation.y += delta * 0.22
    // Gentle parallax toward the pointer — R3F's state.pointer is already
    // normalized to [-1, 1] across the canvas. The bob/float itself is
    // handled by drei's <Float> wrapper below.
    const targetX = reduceMotion ? 0 : state.pointer.y * 0.18
    const targetZ = reduceMotion ? 0 : -state.pointer.x * 0.22
    g.rotation.x += (targetX - g.rotation.x) * Math.min(1, delta * 2.4)
    g.rotation.z += (targetZ - g.rotation.z) * Math.min(1, delta * 2.4)
  })

  return (
    <group ref={group} scale={0.62} position={[0, 0, 0]} rotation={[0.15, 0.4, 0.1]}>
      {/* Cork base */}
      <mesh position={[0, -0.78, 0]} castShadow>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshStandardMaterial color="#f4ede0" roughness={0.6} metalness={0.04} transparent opacity={0.88} />
      </mesh>
      {/* Skirt cone (translucent, suggests the feather flare as a whole) */}
      <mesh position={[0, 0.05, 0]}>
        <coneGeometry args={[0.92, 1.5, 20, 1, true]} />
        <meshStandardMaterial
          color="#fbf7ee"
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
          transparent
          opacity={0.3}
        />
      </mesh>
      {/* Individual feather blades fanned around the skirt */}
      {feathers.map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.5, 0.1, Math.sin(angle) * 0.5]}
          rotation={[0.18, -angle, Math.PI / 2 - 0.25]}
        >
          <planeGeometry args={[0.32, 1.3]} />
          <meshStandardMaterial
            color={i % 4 === 0 ? '#ffb3ab' : '#fbf7ee'}
            roughness={0.7}
            side={THREE.DoubleSide}
            transparent
            opacity={0.78}
          />
        </mesh>
      ))}
    </group>
  )
}

/** The actual WebGL canvas + lighting rig. Kept in its own lazy chunk. */
export default function Hero3DScene({ reduceMotion = false }) {
  return (
    <Canvas
      className="hero-3d-canvas"
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 5], fov: 42 }}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 5]} intensity={1} />
      <pointLight position={[-2.5, -1.5, 2]} intensity={0.8} color="#ff6b6b" />
      <pointLight position={[3, 2, -1]} intensity={0.6} color="#2f7bf0" />
      {/* Positioned in the clear photo area above the session card so its
          feathers stay fully visible instead of dissolving into the card's
          backdrop-filter blur (which erases anything small sitting behind it). */}
      <group position={[1.55, 0.95, 0]}>
        <Float speed={reduceMotion ? 0 : 1.4} rotationIntensity={0} floatIntensity={reduceMotion ? 0 : 0.7}>
          <Shuttlecock reduceMotion={reduceMotion} />
        </Float>
        <Sparkles count={reduceMotion ? 0 : 18} scale={1.4} size={2} speed={0.3} color="#ffb3ab" opacity={0.45} />
      </group>
    </Canvas>
  )
}
