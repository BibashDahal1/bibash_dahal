"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { GOLD } from "@/constants/world";
import { useWood } from "@/hooks/useWood";

const OPEN_W = 2.2;
const OPEN_H = 3.2;

type DoorProps = {
  position: [number, number, number];
  label: string;
  isOpen?: boolean; // Step 4 will flip this automatically
  accent?: string;
};

export default function Door({
  position,
  label,
  isOpen = false,
  accent = GOLD,
}: DoorProps) {
  const leaf = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const wood = useWood("oak");

  useFrame((_, dt) => {
    if (leaf.current) {
      leaf.current.rotation.y = THREE.MathUtils.damp(
        leaf.current.rotation.y,
        isOpen ? 1.5 : 0,
        4,
        dt,
      );
    }
    if (glow.current) {
      glow.current.opacity = THREE.MathUtils.damp(
        glow.current.opacity,
        isOpen ? 0.9 : 0,
        4,
        dt,
      );
    }
  });

  return (
    <group position={position}>
      {/* Light spilling out when open */}
      <mesh position={[0, OPEN_H / 2, 0.02]}>
        <planeGeometry args={[OPEN_W, OPEN_H]} />
        <meshBasicMaterial ref={glow} color={accent} transparent opacity={0} />
      </mesh>

      {/* Frame */}
      <mesh position={[-OPEN_W / 2 - 0.1, OPEN_H / 2 + 0.1, 0.1]}>
        <boxGeometry args={[0.2, OPEN_H + 0.2, 0.2]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>
      <mesh position={[OPEN_W / 2 + 0.1, OPEN_H / 2 + 0.1, 0.1]}>
        <boxGeometry args={[0.2, OPEN_H + 0.2, 0.2]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>
      <mesh position={[0, OPEN_H + 0.1, 0.1]}>
        <boxGeometry args={[OPEN_W + 0.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>

      {/* Door leaf, hinged on the left jamb */}
      <group ref={leaf} position={[-OPEN_W / 2, 0, 0.06]}>
        <mesh position={[OPEN_W / 2, OPEN_H / 2, 0]}>
          <boxGeometry args={[OPEN_W, OPEN_H, 0.08]} />
          <meshStandardMaterial map={wood} roughness={0.5} />
        </mesh>
        <mesh position={[OPEN_W - 0.2, OPEN_H / 2, 0.06]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
        </mesh>
      </group>

      {/* Sign */}
      <Text
        position={[0, OPEN_H + 0.55, 0.12]}
        fontSize={0.28}
        letterSpacing={0.18}
        color={accent}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}
