"use client";

import { useEffect, useMemo } from "react";
import { createCofferTexture } from "@/lib/textures";

const WOOD = "#3d2616";

type Props = { width: number; depth: number; height: number };

/** Coffered ceiling: painted panels, dark wood beams, crown molding, glowing cove light. */
export default function Ceiling({ width: W, depth: D, height: H }: Props) {
  const nx = Math.max(1, Math.round(W / 4));
  const nz = Math.max(1, Math.round(D / 4));

  const coffer = useMemo(() => createCofferTexture(nx, nz), [nx, nz]);
  useEffect(() => () => coffer.dispose(), [coffer]);

  // beams sit exactly on the coffer borders of the texture
  const zBeams = Array.from(
    { length: nz + 1 },
    (_, i) => -D / 2 + (i * D) / nz,
  );
  const xBeams = Array.from(
    { length: nx + 1 },
    (_, i) => -W / 2 + (i * W) / nx,
  );

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={coffer} roughness={0.9} />
      </mesh>

      {zBeams.map((z) => (
        <mesh key={`bz${z}`} position={[0, H - 0.11, z]}>
          <boxGeometry args={[W, 0.22, 0.28]} />
          <meshStandardMaterial color={WOOD} roughness={0.5} />
        </mesh>
      ))}
      {xBeams.map((x) => (
        <mesh key={`bx${x}`} position={[x, H - 0.11, 0]}>
          <boxGeometry args={[0.28, 0.22, D]} />
          <meshStandardMaterial color={WOOD} roughness={0.5} />
        </mesh>
      ))}

      {/* crown molding */}
      {[
        { p: [0, H - 0.08, -D / 2 + 0.08], s: [W, 0.16, 0.16] },
        { p: [0, H - 0.08, D / 2 - 0.08], s: [W, 0.16, 0.16] },
        { p: [-W / 2 + 0.08, H - 0.08, 0], s: [0.16, 0.16, D] },
        { p: [W / 2 - 0.08, H - 0.08, 0], s: [0.16, 0.16, D] },
      ].map((m, i) => (
        <mesh key={i} position={m.p as [number, number, number]}>
          <boxGeometry args={m.s as [number, number, number]} />
          <meshStandardMaterial color="#2a190e" roughness={0.5} />
        </mesh>
      ))}

      {/* warm cove light just under the crown */}
      {[
        { p: [0, H - 0.2, -D / 2 + 0.2], s: [W - 0.4, 0.03, 0.06] },
        { p: [0, H - 0.2, D / 2 - 0.2], s: [W - 0.4, 0.03, 0.06] },
        { p: [-W / 2 + 0.2, H - 0.2, 0], s: [0.06, 0.03, D - 0.4] },
        { p: [W / 2 - 0.2, H - 0.2, 0], s: [0.06, 0.03, D - 0.4] },
      ].map((m, i) => (
        <mesh key={`c${i}`} position={m.p as [number, number, number]}>
          <boxGeometry args={m.s as [number, number, number]} />
          <meshBasicMaterial color="#ffc88a" />
        </mesh>
      ))}
    </group>
  );
}
