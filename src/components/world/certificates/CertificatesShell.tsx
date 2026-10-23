"use client";
import type * as THREE from "three";

import { ReactNode, useEffect, useMemo } from "react";

import Chandelier from "@/components/world/decor/Chandelier";
import Ceiling from "@/components/world/shell/Ceiling";
import { QUALITY } from "@/constants/quality";
import { useWood } from "@/hooks/useWood";
import {
  createCarpetTexture,
  createDamaskTexture,
  createMarbleTexture,
} from "@/lib/classicTextures";
import { useGameStore } from "@/store/useGameStore";

const GOLD = "#c9a24a";
const WAINSCOT = 1.15;

type Props = {
  dims: { width: number; depth: number; height: number };
  children?: ReactNode;
};

/** Navy damask above dark-wood paneling, with a gold chair rail and crown molding. */
function ClassicWall({
  width,
  height,
  position,
  rotationY,
  damask,
}: {
  width: number;
  height: number;
  position: [number, number, number];
  rotationY: number;
  damask: THREE.Texture;
}) {
  const paper = useMemo(() => {
    const t = damask.clone();
    t.repeat.set(width / 2, height / 2);
    t.needsUpdate = true;
    return t;
  }, [damask, width, height]);
  useEffect(() => () => paper.dispose(), [paper]);
  const wood = useWood("dark", [width / 2, WAINSCOT / 2]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={paper} roughness={0.85} />
      </mesh>
      <mesh position={[0, WAINSCOT / 2, 0.008]}>
        <planeGeometry args={[width, WAINSCOT]} />
        <meshStandardMaterial map={wood} roughness={0.5} />
      </mesh>
      {/* baseboard, chair rail (with a gold line), crown molding */}
      <mesh position={[0, 0.13, 0.03]}>
        <boxGeometry args={[width, 0.26, 0.05]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>
      <mesh position={[0, WAINSCOT, 0.04]}>
        <boxGeometry args={[width, 0.1, 0.07]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>
      <mesh position={[0, WAINSCOT + 0.06, 0.078]}>
        <boxGeometry args={[width, 0.018, 0.012]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, height - 0.07, 0.05]}>
        <boxGeometry args={[width, 0.14, 0.1]} />
        <meshStandardMaterial color="#2a190e" roughness={0.5} />
      </mesh>
      <mesh position={[0, height - 0.16, 0.1]}>
        <boxGeometry args={[width, 0.02, 0.012]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** The shell of the Certificates room: marble, runner carpet, damask walls, coffered ceiling, chandeliers. */
export default function CertificatesShell({ dims, children }: Props) {
  const { width: W, depth: D, height: H } = dims;
  const quality = useGameStore((s) => s.quality);

  const carpetLength = D - 4;
  const marble = useMemo(() => createMarbleTexture(W / 4, D / 4), [W, D]);
  const carpet = useMemo(
    () => createCarpetTexture(carpetLength / 4.4),
    [carpetLength],
  );
  const damask = useMemo(() => createDamaskTexture(1, 1), []);
  useEffect(
    () => () => {
      marble.dispose();
      carpet.dispose();
      damask.dispose();
    },
    [marble, carpet, damask],
  );

  const chandelierZ = useMemo(() => {
    const n = Math.max(2, Math.round(D / 12));
    return Array.from({ length: n }, (_, i) => -D / 2 + (D / n) * (i + 0.5));
  }, [D]);

  return (
    <>
      {/* warm gallery light */}
      <ambientLight intensity={0.6} color="#ffe6c7" />
      <hemisphereLight args={["#ffd9a8", "#2a1a14", 0.5]} />
      <pointLight
        position={[0, 3.4, -D / 2 + 3]}
        color="#e8c477"
        intensity={45}
        distance={12}
        decay={2}
      />
      {chandelierZ.map((z) => (
        <Chandelier
          key={z}
          position={[0, H, z]}
          drop={1.1}
          scale={0.9}
          crystals={QUALITY[quality].crystals}
        />
      ))}

      {/* polished marble floor, with the carpet down the middle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={marble} roughness={0.14} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[4.4, carpetLength]} />
        <meshStandardMaterial map={carpet} roughness={0.95} />
      </mesh>

      <Ceiling width={W} depth={D} height={H} />

      <ClassicWall
        width={W}
        height={H}
        position={[0, 0, -D / 2]}
        rotationY={0}
        damask={damask}
      />
      <ClassicWall
        width={W}
        height={H}
        position={[0, 0, D / 2]}
        rotationY={Math.PI}
        damask={damask}
      />
      <ClassicWall
        width={D}
        height={H}
        position={[-W / 2, 0, 0]}
        rotationY={Math.PI / 2}
        damask={damask}
      />
      <ClassicWall
        width={D}
        height={H}
        position={[W / 2, 0, 0]}
        rotationY={-Math.PI / 2}
        damask={damask}
      />

      {children}
    </>
  );
}
