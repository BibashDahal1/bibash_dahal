"use client";

import { useWood } from "@/hooks/useWood";

type Props = {
  position: [number, number, number];
  rotationY?: number; // 0 = long side along z
};

/** A gallery bench: walnut seat, burgundy leather cushion, brass legs. */
export default function Bench({ position, rotationY = 0 }: Props) {
  const wood = useWood("walnut", [1, 2]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.55, 0.1, 2.3]} />
        <meshStandardMaterial map={wood} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.08, 2.2]} />
        <meshStandardMaterial color="#3a1d1d" roughness={0.6} />
      </mesh>
      {[-1, 1].flatMap((sz) =>
        [-1, 1].map((sx) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.2, 0.19, sz * 1.0]}>
            <cylinderGeometry args={[0.03, 0.025, 0.38, 10]} />
            <meshStandardMaterial
              color="#c9a24a"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        )),
      )}
    </group>
  );
}
