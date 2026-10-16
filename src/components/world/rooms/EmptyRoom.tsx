"use client";

import { useEffect, useMemo } from "react";
import { Text } from "@react-three/drei";

import { EMPTY_ROOM, ROOM_THEMES } from "@/constants/rooms";
import { createFloorTexture } from "@/lib/textures";
import type { Destination } from "@/store/useGameStore";

/** Placeholder room: walls, floor, lights and a title. Real furniture comes later. */
export default function EmptyRoom({ dest }: { dest: Destination }) {
  const theme = ROOM_THEMES[dest];
  const { width: W, depth: D, height: H } = EMPTY_ROOM;

  const floor = useMemo(() => createFloorTexture(W / 4, D / 4), [W, D]);
  useEffect(() => () => floor.dispose(), [floor]);

  return (
    <>
      <ambientLight intensity={0.8} color="#fff4e4" />
      <hemisphereLight args={["#fff8ee", "#6b6258", 0.6]} />
      {[-5, 5].map((x) => (
        <pointLight
          key={x}
          position={[x, H - 0.6, 0]}
          color="#ffeccc"
          intensity={80}
          distance={18}
          decay={2}
        />
      ))}
      <pointLight
        position={[0, 3, -D / 2 + 2]}
        color={theme.accent}
        intensity={30}
        distance={9}
        decay={2}
      />

      {/* floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#ece7dd" roughness={0.95} />
      </mesh>

      {/* walls */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={theme.wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color={theme.wall} roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color={theme.wall} roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color={theme.wall} roughness={0.9} />
      </mesh>

      {/* title on the far wall */}
      <Text
        position={[0, 3, -D / 2 + 0.05]}
        fontSize={0.9}
        letterSpacing={0.12}
        color={theme.accent}
        anchorX="center"
        anchorY="middle"
      >
        {theme.title}
      </Text>
      <Text
        position={[0, 2.2, -D / 2 + 0.05]}
        fontSize={0.28}
        letterSpacing={0.2}
        color="#c9bfa6"
        anchorX="center"
        anchorY="middle"
      >
        {theme.subtitle.toUpperCase()}
      </Text>
    </>
  );
}
