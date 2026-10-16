"use client";

import { useEffect, useMemo } from "react";
import { createArtTexture } from "@/lib/textures";

type Props = {
  x: number;
  z: number;
  rotY: number;
  w: number;
  h: number;
  seed: number;
  y?: number;
};

export default function WallArt({ x, z, rotY, w, h, seed, y = 2.6 }: Props) {
  const texture = useMemo(() => createArtTexture(seed, w / h), [seed, w, h]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={[x, y, z]} rotation={[0, rotY, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.06]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.85}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    </group>
  );
}
