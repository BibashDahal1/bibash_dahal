"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import { QUALITY } from "@/constants/quality";
import {
  createTechFloorTextures,
  createTechWallTexture,
} from "@/lib/techTextures";
import { useGameStore } from "@/store/useGameStore";
import DataMotes from "./DataMotes";

type Props = {
  dims: { width: number; depth: number; height: number };
  /** z of the centre of every bay: ceiling rings are placed above them. */
  bayZs: number[];
  accent?: string;
  children?: ReactNode;
};

function TechWall({
  width,
  height,
  position,
  rotationY,
  texture,
  accent,
}: {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY: number;
  texture: THREE.Texture;
  accent: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* dark plinth + neon trims */}
      <mesh position={[0, 0.12, 0.02]}>
        <boxGeometry args={[width, 0.24, 0.03]} />
        <meshStandardMaterial color="#05080e" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.27, 0.03]}>
        <boxGeometry args={[width, 0.05, 0.04]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, height - 0.35, 0.03]}>
        <boxGeometry args={[width, 0.05, 0.04]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The sci-fi shell for the Projects room: glowing grid floor, panelled walls, light-bar ceiling, motes. */
export default function ProjectsShell({
  dims,
  bayZs,
  accent = "#35d0ff",
  children,
}: Props) {
  const { width: W, depth: D, height: H } = dims;
  const quality = useGameStore((s) => s.quality);

  const floor = useMemo(() => createTechFloorTextures(W / 4, D / 4), [W, D]);
  const sideWall = useMemo(() => createTechWallTexture(D / 4, H / 4), [D, H]);
  const endWall = useMemo(() => createTechWallTexture(W / 4, H / 4), [W, H]);
  useEffect(
    () => () => {
      floor.map.dispose();
      floor.glow.dispose();
      sideWall.dispose();
      endWall.dispose();
    },
    [floor, sideWall, endWall],
  );

  // cool white lights down the middle: one every ~12 m
  const lampZ = useMemo(() => {
    const n = Math.max(2, Math.round(D / 12));
    return Array.from({ length: n }, (_, i) => -D / 2 + (D / n) * (i + 0.5));
  }, [D]);

  return (
    <>
      {/* lighting */}
      <ambientLight intensity={0.45} color="#7fb2ff" />
      <hemisphereLight args={["#8fd0ff", "#0a0f1a", 0.55]} />
      {lampZ.map((z) => (
        <pointLight
          key={z}
          position={[0, H - 1, z]}
          color="#bfe9ff"
          intensity={95}
          distance={22}
          decay={2}
        />
      ))}
      <pointLight
        position={[0, 3.5, -D / 2 + 3]}
        color={accent}
        intensity={60}
        distance={12}
        decay={2}
      />

      {/* floor: dark metal, glowing grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floor.map}
          emissive={accent}
          emissiveMap={floor.glow}
          emissiveIntensity={0.85}
          roughness={0.3}
          metalness={0.55}
        />
      </mesh>
      {/* glowing guide lines down the aisle */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.14, 0.01, D - 3]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {[-3.2, 3.2].map((x) => (
        <mesh key={x} position={[x, 0.008, 0]}>
          <boxGeometry args={[0.04, 0.01, D - 3]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.45}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* ceiling: dark, with light bars and a ring over every bay */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#070b12" roughness={0.8} />
      </mesh>
      {[-5, 0, 5].map((x) => (
        <mesh key={x} position={[x, H - 0.03, 0]}>
          <boxGeometry args={[0.18, 0.04, D - 2]} />
          <meshBasicMaterial color="#cfeeff" toneMapped={false} />
        </mesh>
      ))}
      {bayZs.map((z) => (
        <mesh
          key={z}
          position={[0, H - 0.05, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[2.6, 2.75, 64]} />
          <meshBasicMaterial
            color={accent}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* walls */}
      <TechWall
        width={W}
        height={H}
        position={[0, 0, -D / 2]}
        rotationY={0}
        texture={endWall}
        accent={accent}
      />
      <TechWall
        width={W}
        height={H}
        position={[0, 0, D / 2]}
        rotationY={Math.PI}
        texture={endWall}
        accent={accent}
      />
      <TechWall
        width={D}
        height={H}
        position={[-W / 2, 0, 0]}
        rotationY={Math.PI / 2}
        texture={sideWall}
        accent={accent}
      />
      <TechWall
        width={D}
        height={H}
        position={[W / 2, 0, 0]}
        rotationY={-Math.PI / 2}
        texture={sideWall}
        accent={accent}
      />

      {/* title on the far wall */}
      <Text
        position={[0, 3.6, -D / 2 + 0.06]}
        fontSize={1.1}
        letterSpacing={0.25}
        color={accent}
        anchorX="center"
        anchorY="middle"
      >
        PROJECTS
      </Text>
      <Text
        position={[0, 2.7, -D / 2 + 0.06]}
        fontSize={0.24}
        letterSpacing={0.35}
        color="#9fb4c8"
        anchorX="center"
        anchorY="middle"
      >
        AIM AT A SCREEN, IMAGE OR HOLOGRAM
      </Text>

      <DataMotes
        width={W}
        depth={D}
        height={H}
        count={QUALITY[quality].motes}
        color={accent}
      />

      {children}
    </>
  );
}
