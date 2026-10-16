"use client";

import { ReactNode, useEffect, useMemo } from "react";

import { QUALITY } from "@/constants/quality";
import type { RoomTheme } from "@/constants/themes";
import { createFloorTexture } from "@/lib/textures";
import { useGameStore } from "@/store/useGameStore";
import Chandelier from "../decor/Chandelier";
import Ceiling from "./Ceiling";
import SunsetLighting from "./SunsetLighting";
import SunsetWindows from "./SunsetWindows";
import Wall from "./Wall";

type Props = {
  dims: { width: number; depth: number; height: number };
  theme: RoomTheme;
  chandelierScale?: number;
  /** z positions of the chandeliers. Default: one every ~14 m down the middle. */
  chandelierZ?: number[];
  children?: ReactNode;
};

/** Everything that makes a room a room: wood plank floor, wood walls, coffered ceiling, chandeliers, sunset light. */
export default function RoomShell({
  dims,
  theme,
  chandelierScale = 1,
  chandelierZ,
  children,
}: Props) {
  const { width: W, depth: D, height: H } = dims;
  const quality = useGameStore((s) => s.quality);
  const q = QUALITY[quality];

  // one texture tile = 1.6 m of planks
  const floor = useMemo(() => createFloorTexture(W / 1.6, D / 1.6), [W, D]);
  useEffect(() => () => floor.dispose(), [floor]);

  const chandelierPositions = useMemo(() => {
    if (chandelierZ) return chandelierZ;
    const n = Math.max(2, Math.round(D / 14));
    return Array.from({ length: n }, (_, i) => -D / 2 + (D / n) * (i + 0.5));
  }, [chandelierZ, D]);

  const windowZ = q.sun
    ? theme.windowZ
    : theme.windowZ.filter((_, i) => i % 2 === 0);

  return (
    <>
      <SunsetLighting sun={q.sun} accent={theme.accent} depth={D} />

      {chandelierPositions.map((z) => (
        <Chandelier
          key={z}
          position={[0, H, z]}
          drop={H > 6 ? 1.7 : 1.1}
          scale={chandelierScale}
          crystals={q.crystals}
        />
      ))}
      {q.sun &&
        [-D / 3, D / 3].map((z) => (
          <pointLight
            key={z}
            position={[0, H - 1, z]}
            color="#ffd9a8"
            intensity={50}
            distance={20}
            decay={2}
          />
        ))}

      {/* polished wood plank floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.32} metalness={0.02} />
      </mesh>

      <Ceiling width={W} depth={D} height={H} />

      <Wall
        width={W}
        height={H}
        position={[0, 0, -D / 2]}
        rotationY={0}
        theme={theme}
        full
      />
      <Wall
        width={W}
        height={H}
        position={[0, 0, D / 2]}
        rotationY={Math.PI}
        theme={theme}
      />
      <Wall
        width={D}
        height={H}
        position={[-W / 2, 0, 0]}
        rotationY={Math.PI / 2}
        theme={theme}
      />
      <Wall
        width={D}
        height={H}
        position={[W / 2, 0, 0]}
        rotationY={-Math.PI / 2}
        theme={theme}
      />

      {windowZ.length > 0 && <SunsetWindows width={W} zs={windowZ} />}

      {children}
    </>
  );
}
