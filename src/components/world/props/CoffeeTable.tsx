import { useWood } from "@/hooks/useWood";

export default function CoffeeTable({
  position,
}: {
  position: [number, number, number];
}) {
  const wood = useWood("oak");
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.7]} />
        <meshStandardMaterial map={wood} roughness={0.35} />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * 0.54, 0.2, sz * 0.29]}>
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshStandardMaterial map={wood} roughness={0.4} />
        </mesh>
      ))}
      {/* magazines */}
      <mesh position={[-0.2, 0.455, 0.05]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.28, 0.015, 0.2]} />
        <meshStandardMaterial color="#8c3b3b" roughness={0.6} />
      </mesh>
      <mesh position={[-0.18, 0.47, 0.06]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.26, 0.015, 0.19]} />
        <meshStandardMaterial color="#e9e2d3" roughness={0.6} />
      </mesh>
      {/* small gold bowl */}
      <mesh position={[0.3, 0.48, -0.05]}>
        <cylinderGeometry args={[0.1, 0.06, 0.07, 16]} />
        <meshStandardMaterial
          color="#d4af37"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
