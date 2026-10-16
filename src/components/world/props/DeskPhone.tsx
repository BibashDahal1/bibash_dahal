type Props = { position: [number, number, number]; rotationY?: number };

export default function DeskPhone({ position, rotationY = 0 }: Props) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.18, 0.06, 0.22]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.07, 0.03, 0.2]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.062, 0.1]}>
        <boxGeometry args={[0.1, 0.005, 0.04]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
