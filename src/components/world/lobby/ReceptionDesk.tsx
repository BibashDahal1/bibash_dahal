"use client";

import { Text } from "@react-three/drei";
import { DESK, GOLD } from "@/constants/world";
import { useWood } from "@/hooks/useWood";

const DESK_HEIGHT = 1.05;

export default function ReceptionDesk() {
  const r = DESK.radius;
  const front = useWood("walnut", [3, 1]);
  const top = useWood("dark", [2, 2]);

  return (
    <group position={[0, 0, DESK.z]}>
      {/* curved wooden front, semicircle bulging toward +z */}
      <mesh position={[0, DESK_HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[r, r, DESK_HEIGHT, 64, 1, true, -Math.PI / 2, Math.PI]}
        />
        <meshStandardMaterial map={front} roughness={0.4} side={2} />
      </mesh>

      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry
          args={[
            r + 0.012,
            r + 0.012,
            0.05,
            64,
            1,
            true,
            -Math.PI / 2,
            Math.PI,
          ]}
        />
        <meshStandardMaterial
          color={GOLD}
          metalness={0.9}
          roughness={0.3}
          side={2}
        />
      </mesh>

      {/* polished counter top */}
      <mesh position={[0, DESK_HEIGHT, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r - 0.9, r + 0.15, 64, 1, Math.PI, Math.PI]} />
        <meshStandardMaterial map={top} roughness={0.2} metalness={0.1} />
      </mesh>

      <Text
        position={[0, 0.5, r + 0.02]}
        fontSize={0.2}
        letterSpacing={0.2}
        color={GOLD}
        anchorX="center"
        anchorY="middle"
      >
        RECEPTION
      </Text>

      <mesh position={[0.6, DESK_HEIGHT + 0.06, r - 0.45]}>
        <cylinderGeometry args={[0.07, 0.1, 0.1, 24]} />
        <meshStandardMaterial color={GOLD} metalness={1} roughness={0.2} />
      </mesh>
    </group>
  );
}
