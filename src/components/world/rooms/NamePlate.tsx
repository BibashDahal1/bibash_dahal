import { Text } from "@react-three/drei";
import { GOLD } from "@/constants/world";

/** Desk name plate. Tilted back so it reads from standing height. Faces +z. */
export default function NamePlate({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position} rotation={[-0.35, 0, 0]}>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[0.92, 0.19, 0.03]} />
        <meshStandardMaterial color="#14110e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[0.9, 0.17, 0.01]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.28} />
      </mesh>
      <Text
        position={[0, 0.03, 0.013]}
        fontSize={0.06}
        letterSpacing={0.08}
        color="#1a140a"
        anchorX="center"
        anchorY="middle"
      >
        BIBASH DAHAL
      </Text>
      <Text
        position={[0, -0.04, 0.013]}
        fontSize={0.028}
        letterSpacing={0.12}
        color="#3b2a10"
        anchorX="center"
        anchorY="middle"
      >
        FULL STACK DEVELOPER
      </Text>
    </group>
  );
}
