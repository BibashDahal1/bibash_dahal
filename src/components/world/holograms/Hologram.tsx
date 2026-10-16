"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import { useInteractable } from "@/hooks/useInteractable";
import { useLogoTexture } from "@/hooks/useLogoTexture";
import { initials } from "@/lib/logoTexture";
import { playerPos } from "@/lib/player";
import { useGameStore } from "@/store/useGameStore";

const RADIUS = 0.5;
const HEIGHT = 1.1;
const SEGMENTS = 48;
const BASE_Y = 1.55;
const SPIN = 0.35;
const TILES = 3; // circumference ≈ 3.14 and the drum is 1.1 tall, so 3 square tiles fit without stretching
const CULL_DISTANCE = 18; // hidden (and not animated) when the visitor is further away

type Props = {
  id: string;
  x: number;
  z: number;
  name: string;
  color: string;
  logo?: string | null;
  badge?: string;
  subtitle?: string;
  scale?: number;
  /** "gallery" = light stone pedestal (Office), "tech" = dark metal with glowing edges (Projects). */
  variant?: "gallery" | "tech";
  interactLabel: string;
  onActivate: () => void;
};

export default function Hologram({
  id,
  x,
  z,
  name,
  color,
  logo,
  badge,
  subtitle,
  scale = 1,
  variant = "gallery",
  interactLabel,
  onActivate,
}: Props) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const hit = useRef<THREE.Mesh>(null);

  const hovered = useGameStore((s) => s.hover?.id === id);
  const texture = useLogoTexture(logo, initials(name, badge), color, TILES);
  useInteractable(hit, id, interactLabel, onActivate);

  const direction = x < 0 ? 1 : -1; // neighbours spin the opposite way
  const tech = variant === "tech";

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const near = Math.hypot(playerPos.x - x, playerPos.z - z) < CULL_DISTANCE;
    if (g.visible !== near) g.visible = near;
    if (!near || !spin.current) return;

    spin.current.rotation.y += dt * SPIN * direction;
    spin.current.position.y =
      BASE_Y + Math.sin(state.clock.elapsedTime * 1.2 + x * 0.7 + z) * 0.03;
  });

  const rim = (y: number) => (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[RADIUS - 0.012, RADIUS + 0.012, SEGMENTS]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.75}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );

  return (
    <group ref={root} position={[x, 0, z]} scale={scale}>
      {/* invisible, generous hit-box so aiming is forgiving */}
      <mesh ref={hit} visible={false} position={[0, 1.05, 0]}>
        <boxGeometry args={[1.2, 2.1, 1.2]} />
        <meshBasicMaterial />
      </mesh>

      {/* pedestal */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={tech ? "#0f1724" : "#dedad0"}
          roughness={tech ? 0.35 : 0.5}
          metalness={tech ? 0.7 : 0}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, 1.03, 0]}>
        <boxGeometry args={[0.94, 0.06, 0.94]} />
        <meshStandardMaterial
          color={tech ? "#141f33" : "#f4f1ea"}
          roughness={0.4}
          metalness={tech ? 0.6 : 0}
        />
      </mesh>
      {tech &&
        [0.06, 0.96].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[1.03, 0.025, 1.03]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={hovered ? 1 : 0.8}
              toneMapped={false}
            />
          </mesh>
        ))}

      {/* emitter ring */}
      <mesh position={[0, 1.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.44, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.95 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* rotating hologram drum */}
      <group ref={spin} position={[0, BASE_Y, 0]}>
        <mesh>
          <cylinderGeometry
            args={[RADIUS, RADIUS, HEIGHT, SEGMENTS, 1, true]}
          />
          <meshBasicMaterial
            key={texture ? "tex" : "plain"}
            map={texture ?? undefined}
            color={texture ? "#ffffff" : color}
            transparent
            opacity={texture ? (hovered ? 0.97 : 0.84) : 0.3}
            side={THREE.DoubleSide}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
        {rim(HEIGHT / 2)}
        {rim(-HEIGHT / 2)}
      </group>

      {/* labels (do not spin) */}
      <Text
        position={[0, BASE_Y + HEIGHT / 2 + 0.3, 0]}
        fontSize={0.13}
        maxWidth={1.5}
        textAlign="center"
        letterSpacing={0.04}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
      {subtitle && (
        <Text
          position={[0, BASE_Y + HEIGHT / 2 + 0.12, 0]}
          fontSize={0.075}
          letterSpacing={0.1}
          color="#c9bfa6"
          anchorX="center"
          anchorY="middle"
        >
          {subtitle.toUpperCase()}
        </Text>
      )}
    </group>
  );
}
