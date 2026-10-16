"use client";

import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BRASS = "#c9a24a";
const RINGS = [
  { r: 0.95, y: 0, candles: 8, share: 0.45 },
  { r: 0.66, y: -0.38, candles: 6, share: 0.33 },
  { r: 0.38, y: -0.74, candles: 4, share: 0.22 },
];

const IDENTITY = new THREE.Quaternion();
const compose = (
  p: [number, number, number],
  s: [number, number, number],
  q = IDENTITY,
) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(...p),
    q,
    new THREE.Vector3(...s),
  );

function crystalMatrices(total: number) {
  const out: THREE.Matrix4[] = [];
  for (const ring of RINGS) {
    const n = Math.max(3, Math.round(total * ring.share));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const len = 0.16 + ((i * 7 + Math.round(ring.r * 10)) % 5) * 0.045;
      out.push(
        compose(
          [Math.cos(a) * ring.r, ring.y - len / 2 - 0.02, Math.sin(a) * ring.r],
          [0.028, len / 2, 0.028],
        ),
      );
    }
  }
  out.push(compose([0, -1.12, 0], [0.075, 0.24, 0.075])); // the big centre drop
  return out;
}

function candleMatrices(part: "candle" | "flame") {
  const out: THREE.Matrix4[] = [];
  for (const ring of RINGS) {
    for (let i = 0; i < ring.candles; i++) {
      const a = (i / ring.candles) * Math.PI * 2 + 0.2;
      const x = Math.cos(a) * ring.r;
      const z = Math.sin(a) * ring.r;
      out.push(
        part === "candle"
          ? compose([x, ring.y + 0.09, z], [0.04, 0.14, 0.04])
          : compose([x, ring.y + 0.2, z], [0.018, 0.034, 0.018]),
      );
    }
  }
  return out;
}

function spokeMatrices() {
  const out: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  for (const ring of RINGS) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      out.push(
        compose(
          [(Math.cos(a) * ring.r) / 2, ring.y, (Math.sin(a) * ring.r) / 2],
          [ring.r, 0.018, 0.018],
          q.clone(),
        ),
      );
    }
  }
  return out;
}

function Instances({
  matrices,
  children,
}: {
  matrices: THREE.Matrix4[];
  children: ReactNode;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return (
    <instancedMesh
      key={matrices.length}
      ref={ref}
      args={[undefined, undefined, matrices.length]}
      frustumCulled={false}
    >
      {children}
    </instancedMesh>
  );
}

type Props = {
  position: [number, number, number]; // where it meets the ceiling
  drop?: number; // chain length
  scale?: number;
  crystals?: number;
};

/** Brass-and-glass chandelier: instanced crystals / candles / spokes, slow spin, sparkle, and a real light. */
export default function Chandelier({
  position,
  drop = 1.5,
  scale = 1,
  crystals = 150,
}: Props) {
  const body = useRef<THREE.Group>(null);
  const glass = useRef<THREE.MeshStandardMaterial>(null);

  const crystalM = useMemo(() => crystalMatrices(crystals), [crystals]);
  const candleM = useMemo(() => candleMatrices("candle"), []);
  const flameM = useMemo(() => candleMatrices("flame"), []);
  const spokeM = useMemo(() => spokeMatrices(), []);

  useFrame(({ clock }, dt) => {
    if (body.current) body.current.rotation.y += dt * 0.12;
    if (glass.current)
      glass.current.emissiveIntensity =
        0.2 + 0.12 * Math.sin(clock.elapsedTime * 1.8 + position[2]);
  });

  return (
    <group position={position} scale={scale}>
      {/* ceiling rose + chain */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 0.08, 20]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, -drop / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, drop, 6]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
      </mesh>

      <group ref={body} position={[0, -drop, 0]}>
        {/* column + finial */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.0, 12]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
        </mesh>

        {/* rings */}
        {RINGS.map((ring) => (
          <mesh
            key={ring.r}
            position={[0, ring.y, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[ring.r, 0.018, 8, 40]} />
            <meshStandardMaterial
              color={BRASS}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        ))}

        <Instances matrices={spokeM}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
        </Instances>
        <Instances matrices={candleM}>
          <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
          <meshStandardMaterial color="#f4ecd8" roughness={0.6} />
        </Instances>
        <Instances matrices={flameM}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#ffd98a" />
        </Instances>

        {/* the glass */}
        <Instances matrices={crystalM}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            ref={glass}
            color="#dff3ff"
            transparent
            opacity={0.62}
            roughness={0.05}
            metalness={0.2}
            emissive="#ffd8a0"
            emissiveIntensity={0.2}
            flatShading
            depthWrite={false}
          />
        </Instances>

        <pointLight
          position={[0, -0.25, 0]}
          color="#ffe2b8"
          intensity={170 * scale * scale}
          distance={24}
          decay={2}
        />
      </group>
    </group>
  );
}
