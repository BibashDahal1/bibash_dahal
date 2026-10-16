"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  width: number;
  depth: number;
  height: number;
  count: number;
  color: string;
};

/** Slowly rising specks of light, like floating data. One draw call. */
export default function DataMotes({
  width,
  depth,
  height,
  count,
  color,
}: Props) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * (width - 1);
      a[i * 3 + 1] = Math.random() * height;
      a[i * 3 + 2] = (Math.random() - 0.5) * (depth - 1);
    }
    return a;
  }, [count, width, depth, height]);

  const speeds = useMemo(
    () =>
      Float32Array.from({ length: count }, () => 0.05 + Math.random() * 0.15),
    [count],
  );

  useFrame((_, dt) => {
    const attr = ref.current?.geometry.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    if (!attr) return;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i] * dt;
      if (y > height) y = 0;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points key={count} ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
