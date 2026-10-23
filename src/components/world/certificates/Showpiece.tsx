"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GOLD = "#e0b64a";

/** A gold trophy turning slowly on a marble pedestal under a glass dome, in a soft spotlight. */
export default function Showpiece({ x, z }: { x: number; z: number }) {
  const spin = useRef<THREE.Group>(null);

  // the cup's outline, spun around the vertical axis
  const profile = useMemo(
    () =>
      [
        [0.001, 0],
        [0.16, 0],
        [0.16, 0.04],
        [0.06, 0.09],
        [0.04, 0.2],
        [0.07, 0.26],
        [0.2, 0.33],
        [0.27, 0.5],
        [0.26, 0.52],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
    [],
  );

  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.5;
  });

  return (
    <group position={[x, 0, z]}>
      {/* marble pedestal with gold bands */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 1.1, 32]} />
        <meshStandardMaterial
          color="#eae4d6"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.06, 32]} />
        <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.09, 0]}>
        <cylinderGeometry args={[0.63, 0.63, 0.04, 32]} />
        <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.25} />
      </mesh>

      {/* the trophy */}
      <group ref={spin} position={[0, 1.11, 0]}>
        <mesh>
          <latheGeometry args={[profile, 40]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={1}
            roughness={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        {([1, -1] as const).map((s) => (
          <mesh
            key={s}
            position={[s * 0.25, 0.4, 0]}
            rotation={[0, 0, (-s * Math.PI) / 2]}
          >
            <torusGeometry args={[0.1, 0.015, 10, 20, Math.PI]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.22} />
          </mesh>
        ))}
      </group>

      {/* glass dome */}
      <mesh position={[0, 1.11, 0]}>
        <sphereGeometry args={[0.66, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#e3f1ff"
          transparent
          opacity={0.14}
          roughness={0.04}
          metalness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.67, 0.67, 0.03, 40]} />
        <meshStandardMaterial color={GOLD} metalness={0.95} roughness={0.25} />
      </mesh>

      {/* a soft spotlight beam from the ceiling, and a little warm light inside the dome */}
      <mesh position={[0, 3.45, 0]}>
        <cylinderGeometry args={[0.3, 1.0, 4.7, 32, 1, true]} />
        <meshBasicMaterial
          color="#ffe2a8"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        position={[0, 1.7, 0]}
        color="#ffd98a"
        intensity={22}
        distance={6}
        decay={2}
      />
    </group>
  );
}
