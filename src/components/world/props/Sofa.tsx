"use client";

import { SOFA_SIZE } from "@/constants/lobbyLayout";
import { useWood } from "@/hooks/useWood";

type Props = {
  position: [number, number, number];
  rotationY?: number; // 0 = faces +z
  color?: string;
};

/**
 * Wooden-framed sofa. The plinth is recessed at the front, so the shins and feet of anyone sitting have
 * room, and the cushion top is at y = 0.50 (sitters' hips are placed at SOFA_SEAT_HEIGHT).
 */
export default function Sofa({
  position,
  rotationY = 0,
  color = "#5a3d2b",
}: Props) {
  const { w, d } = SOFA_SIZE;
  const wood = useWood("walnut");
  const armW = 0.2;
  const seatW = w - armW * 2;
  const seatD = d - 0.2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* wooden plinth, recessed at the front */}
      <mesh position={[0, 0.19, -0.03]}>
        <boxGeometry args={[w - 0.05, 0.32, d - 0.14]} />
        <meshStandardMaterial map={wood} roughness={0.5} />
      </mesh>

      {/* two seat cushions */}
      {[-1, 1].map((s) => (
        <mesh key={`seat${s}`} position={[(s * seatW) / 4, 0.43, 0.04]}>
          <boxGeometry args={[seatW / 2 - 0.02, 0.14, seatD]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}

      {/* backrest frame + two thick back cushions, leaning back a little */}
      <mesh position={[0, 0.62, -d / 2 + 0.08]}>
        <boxGeometry args={[w - 0.05, 0.62, 0.16]} />
        <meshStandardMaterial map={wood} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={`back${s}`}
          position={[(s * seatW) / 4, 0.74, -0.22]}
          rotation={[-0.12, 0, 0]}
        >
          <boxGeometry args={[seatW / 2 - 0.04, 0.42, 0.16]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}

      {/* arms: wooden frame + padded top */}
      {[-1, 1].map((s) => (
        <group key={`arm${s}`} position={[s * (w / 2 - armW / 2), 0, 0]}>
          <mesh position={[0, 0.34, 0]}>
            <boxGeometry args={[armW, 0.36, d - 0.05]} />
            <meshStandardMaterial map={wood} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <boxGeometry args={[armW + 0.02, 0.1, d - 0.07]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* wooden feet */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <mesh
          key={`foot${sx}${sz}`}
          position={[sx * (w / 2 - 0.1), 0.03, sz * (d / 2 - 0.1)]}
        >
          <cylinderGeometry args={[0.04, 0.03, 0.06, 8]} />
          <meshStandardMaterial color="#3b2a1d" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
