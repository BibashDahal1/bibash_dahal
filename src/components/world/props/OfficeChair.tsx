type OfficeChairProps = {
  position: [number, number, number];
  rotationY?: number; // 0 = faces +z (backrest at -z)
  seatHeight?: number;
  color?: string;
};

export default function OfficeChair({
  position,
  rotationY = 0,
  seatHeight = 0.5,
  color = "#2a2a2e",
}: OfficeChairProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, seatHeight - 0.04, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, seatHeight + 0.3, -0.24]}>
        <boxGeometry args={[0.46, 0.55, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, (seatHeight - 0.08) / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.035, seatHeight - 0.08, 10]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}
