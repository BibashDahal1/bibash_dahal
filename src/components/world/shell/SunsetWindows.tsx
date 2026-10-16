"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createGlowTexture, createSunsetTexture } from "@/lib/textures";

const WIN_W = 1.8;
const WIN_H = 2.5;
const WIN_Y = 4.9;

type Props = { width: number; zs: number[] };

/** Tall windows onto a painted sunset, with a patch of warm light on the floor under each. */
export default function SunsetWindows({ width: W, zs }: Props) {
  const sky = useMemo(() => createSunsetTexture(), []);
  const glow = useMemo(() => createGlowTexture(), []);
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a190e", roughness: 0.5 }),
    [],
  );
  useEffect(
    () => () => {
      sky.dispose();
      glow.dispose();
      frame.dispose();
    },
    [sky, glow, frame],
  );

  return (
    <>
      {([-1, 1] as const).flatMap((side) =>
        zs.map((z) => (
          <group key={`${side}:${z}`}>
            <group
              position={[side * (W / 2 - 0.02), WIN_Y, z]}
              rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            >
              <mesh>
                <planeGeometry args={[WIN_W, WIN_H]} />
                <meshBasicMaterial map={sky} toneMapped={false} fog={false} />
              </mesh>
              {/* frame */}
              <mesh material={frame} position={[0, WIN_H / 2 + 0.05, 0.03]}>
                <boxGeometry args={[WIN_W + 0.2, 0.1, 0.08]} />
              </mesh>
              <mesh material={frame} position={[0, -WIN_H / 2 - 0.05, 0.03]}>
                <boxGeometry args={[WIN_W + 0.2, 0.1, 0.08]} />
              </mesh>
              <mesh material={frame} position={[-WIN_W / 2 - 0.05, 0, 0.03]}>
                <boxGeometry args={[0.1, WIN_H, 0.08]} />
              </mesh>
              <mesh material={frame} position={[WIN_W / 2 + 0.05, 0, 0.03]}>
                <boxGeometry args={[0.1, WIN_H, 0.08]} />
              </mesh>
              {/* mullions + sill */}
              <mesh material={frame} position={[0, 0, 0.03]}>
                <boxGeometry args={[0.04, WIN_H, 0.05]} />
              </mesh>
              <mesh material={frame} position={[0, 0.2, 0.03]}>
                <boxGeometry args={[WIN_W, 0.04, 0.05]} />
              </mesh>
              <mesh material={frame} position={[0, -WIN_H / 2 - 0.12, 0.08]}>
                <boxGeometry args={[WIN_W + 0.3, 0.06, 0.18]} />
              </mesh>
            </group>

            {/* sun patch on the floor */}
            <mesh
              position={[side * (W / 2 - 3.3), 0.03, z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[5, 2.4]} />
              <meshBasicMaterial
                map={glow}
                color="#ff9a52"
                transparent
                opacity={0.38}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        )),
      )}
    </>
  );
}
