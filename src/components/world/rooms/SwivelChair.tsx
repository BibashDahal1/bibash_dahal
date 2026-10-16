"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useInteractable } from "@/hooks/useInteractable";

const LEATHER = "#1b1b1f";
const METAL = "#9a9a9a";

/** Executive chair: sways gently on its own; activating gives it a good spin. Faces +z. */
export default function SwivelChair({
  position,
}: {
  position: [number, number, number];
}) {
  const swivel = useRef<THREE.Group>(null);
  const hit = useRef<THREE.Mesh>(null);
  const spin = useRef(0);

  useInteractable(hit, "chair:swivel", "Spin the chair", () => {
    spin.current = 9;
  });

  useFrame((state, dt) => {
    const g = swivel.current;
    if (!g) return;
    spin.current = THREE.MathUtils.damp(spin.current, 0, 0.9, dt);
    if (spin.current > 0.15) {
      g.rotation.y += spin.current * dt;
    } else {
      const wrapped = Math.atan2(
        Math.sin(g.rotation.y),
        Math.cos(g.rotation.y),
      );
      g.rotation.y = THREE.MathUtils.damp(
        wrapped,
        Math.sin(state.clock.elapsedTime * 0.45) * 0.5,
        2,
        dt,
      );
    }
  });

  return (
    <group position={position}>
      <mesh ref={hit} visible={false} position={[0, 0.7, 0]}>
        <boxGeometry args={[0.9, 1.4, 0.9]} />
        <meshBasicMaterial />
      </mesh>

      {/* fixed base: gas lift, five legs, wheels */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.4, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.3} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
          <mesh position={[0.17, 0.07, 0]}>
            <boxGeometry args={[0.34, 0.035, 0.05]} />
            <meshStandardMaterial
              color="#1a1a1a"
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0.33, 0.04, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#111111" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* the part that rotates */}
      <group ref={swivel}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.56, 0.1, 0.55]} />
          <meshStandardMaterial color={LEATHER} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.92, -0.27]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.52, 0.72, 0.08]} />
          <meshStandardMaterial color={LEATHER} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.4, -0.3]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.3, 0.17, 0.08]} />
          <meshStandardMaterial color={LEATHER} roughness={0.5} />
        </mesh>
        {([-1, 1] as const).map((s) => (
          <group key={s}>
            <mesh position={[s * 0.3, 0.7, 0]}>
              <boxGeometry args={[0.06, 0.04, 0.4]} />
              <meshStandardMaterial color={LEATHER} roughness={0.5} />
            </mesh>
            <mesh position={[s * 0.3, 0.6, 0.1]}>
              <boxGeometry args={[0.04, 0.2, 0.04]} />
              <meshStandardMaterial
                color={METAL}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
