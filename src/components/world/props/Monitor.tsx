type Props = { position: [number, number, number]; rotationY?: number };

/** Local front (the screen) faces +z. */
export default function Monitor({ position, rotationY = 0 }: Props) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.03, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.04, 0.25, 0.04]} />
        <meshStandardMaterial color="#222222" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.55, 0.34, 0.03]} />
        <meshStandardMaterial color="#161616" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.4, 0.017]}>
        <planeGeometry args={[0.5, 0.29]} />
        <meshBasicMaterial color="#7fb7e6" />
      </mesh>
    </group>
  );
}
