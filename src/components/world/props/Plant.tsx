type Variant = "bush" | "tall" | "snake";
type Props = {
  position: [number, number, number];
  variant?: Variant;
  scale?: number;
};

const BUSH = [
  { p: [0, 0.8, 0], c: "#3f7d3a", s: 1.0 },
  { p: [0.2, 0.62, 0.05], c: "#4a8b43", s: 0.85 },
  { p: [-0.19, 0.64, -0.05], c: "#35702f", s: 0.9 },
  { p: [0.05, 0.58, 0.2], c: "#4a8b43", s: 0.8 },
  { p: [-0.05, 0.6, -0.2], c: "#3f7d3a", s: 0.8 },
  { p: [0.1, 1.0, -0.05], c: "#56994d", s: 0.7 },
] as const;

function Pot({ color = "#6b4a35" }: { color?: string }) {
  return (
    <mesh position={[0, 0.18, 0]}>
      <cylinderGeometry args={[0.24, 0.17, 0.36, 16]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function Bush() {
  return (
    <>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.5, 6]} />
        <meshStandardMaterial color="#3a5a2a" roughness={0.9} />
      </mesh>
      {BUSH.map((l, i) => (
        <mesh
          key={i}
          position={[l.p[0], l.p[1], l.p[2]]}
          scale={[l.s, l.s * 1.3, l.s]}
        >
          <icosahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={l.c} roughness={0.85} flatShading />
        </mesh>
      ))}
    </>
  );
}

function Tall() {
  return (
    <>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 1.1, 8]} />
        <meshStandardMaterial color="#6b5238" roughness={0.9} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * 0.3,
              1.5 + (i % 2) * 0.08,
              Math.sin(a) * 0.3,
            ]}
            rotation={[0, -a, -0.45]}
            scale={[1.5, 0.22, 0.5]}
          >
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshStandardMaterial
              color={i % 2 ? "#3f7d3a" : "#4a8b43"}
              roughness={0.8}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 1.55, 0]} scale={[1, 0.8, 1]}>
        <icosahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#56994d" roughness={0.85} flatShading />
      </mesh>
    </>
  );
}

function Snake() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const h = 0.6 + (i % 3) * 0.2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.1, 0.35 + h / 2, Math.sin(a) * 0.1]}
            rotation={[Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18]}
          >
            <coneGeometry args={[0.065, h, 6]} />
            <meshStandardMaterial
              color={i % 2 ? "#2f5d34" : "#3d7a40"}
              roughness={0.8}
              flatShading
            />
          </mesh>
        );
      })}
    </>
  );
}

export default function Plant({
  position,
  variant = "bush",
  scale = 1,
}: Props) {
  return (
    <group position={position} scale={scale}>
      <Pot
        color={
          variant === "snake"
            ? "#3b3b40"
            : variant === "tall"
              ? "#8a6a4a"
              : "#6b4a35"
        }
      />
      {variant === "bush" && <Bush />}
      {variant === "tall" && <Tall />}
      {variant === "snake" && <Snake />}
    </group>
  );
}
