"use client";

import { DESK_FILES } from "@/data/files";
import { GOLD } from "@/constants/world";
import OfficeChair from "@/components/world/props/OfficeChair";
import DeskFile from "./DeskFile";
import NamePlate from "./NamePlate";
import SwivelChair from "./SwivelChair";
import { useWood } from "@/hooks/useWood";

const TOP = 0.79; // desk-top surface height
const WOOD = "#3b2a1d";

/** Executive desk with name plate, files, lamp, chairs. Origin = desk centre on the floor; front faces +z. */
export default function OfficeDesk({ x, z }: { x: number; z: number }) {
  const topWood = useWood("walnut", [2, 1]);
  const bodyWood = useWood("dark", [1, 1]);
  return (
    <group position={[x, 0, z]}>
      {/* top + gold edge */}
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[2.6, 0.06, 1.1]} />
        <meshStandardMaterial map={topWood} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.735, 0]}>
        <boxGeometry args={[2.64, 0.012, 1.14]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
      </mesh>

      {/* drawer pedestals with drawer fronts */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * 0.9, 0, 0]}>
          <mesh position={[0, 0.365, 0]}>
            <boxGeometry args={[0.75, 0.73, 1.0]} />
            <meshStandardMaterial map={bodyWood} roughness={0.5} />
          </mesh>
          {[0.6, 0.4, 0.2].map((y) => (
            <mesh key={y} position={[0, y, 0.505]}>
              <boxGeometry args={[0.62, 0.15, 0.01]} />
              <meshStandardMaterial map={topWood} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {/* front panel between the pedestals */}
      <mesh position={[0, 0.48, 0.48]}>
        <boxGeometry args={[1.05, 0.55, 0.03]} />
        <meshStandardMaterial map={bodyWood} roughness={0.5} />
      </mesh>

      {/* things on the desk */}
      <NamePlate position={[0, TOP + 0.08, 0.38]} />

      {DESK_FILES.map((file, i) => (
        <DeskFile
          key={file.id}
          file={file}
          position={[0.55 + i * 0.4, TOP, -0.08]}
          rotationY={i % 2 === 0 ? 0.12 : -0.1}
        />
      ))}

      {/* lamp */}
      <group position={[-1.0, TOP, -0.3]}>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.03, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.52, 0.04]}>
          <coneGeometry args={[0.12, 0.14, 16, 1, true]} />
          <meshStandardMaterial color="#1c3a2c" roughness={0.5} side={2} />
        </mesh>
        <mesh position={[0, 0.49, 0.04]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#fff3d6" />
        </mesh>
      </group>

      {/* pen cup + paper stack */}
      <mesh position={[-0.55, TOP + 0.06, -0.25]}>
        <cylinderGeometry args={[0.04, 0.035, 0.12, 12]} />
        <meshStandardMaterial color="#222222" roughness={0.5} />
      </mesh>
      <mesh position={[-0.35, TOP + 0.015, 0.05]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.24, 0.03, 0.32]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
      </mesh>

      {/* owner's revolving chair behind the desk, two visitor chairs in front */}
      <SwivelChair position={[0, 0, -1.15]} />
      <OfficeChair
        position={[-1.5, 0, 1.9]}
        rotationY={Math.PI}
        seatHeight={0.48}
        color="#5a3d2b"
      />
      <OfficeChair
        position={[1.5, 0, 1.9]}
        rotationY={Math.PI}
        seatHeight={0.48}
        color="#5a3d2b"
      />
    </group>
  );
}
