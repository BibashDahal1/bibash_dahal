type Props = {
  position: [number, number, number];
  size: [number, number];
  color?: string;
};

export default function Rug({ position, size, color = "#3a2a2a" }: Props) {
  const [w, d] = size;
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[w - 0.4, d - 0.4]} />
        <meshStandardMaterial color="#4a3a32" roughness={1} />
      </mesh>
    </group>
  );
}
