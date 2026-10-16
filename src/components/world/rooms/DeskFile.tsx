"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import type { DocFile } from "@/data/types";
import { useInteractable } from "@/hooks/useInteractable";
import { useGameStore } from "@/store/useGameStore";

type Props = {
  file: DocFile;
  position: [number, number, number];
  rotationY?: number;
};

/** A folder lying on the desk. Lifts when aimed at; activating opens the document viewer. */
export default function DeskFile({ file, position, rotationY = 0 }: Props) {
  const lift = useRef<THREE.Group>(null);
  const hit = useRef<THREE.Mesh>(null);
  const id = `file:${file.id}`;
  const hovered = useGameStore((s) => s.hover?.id === id);

  useInteractable(hit, id, `Open ${file.label}`, () =>
    useGameStore.getState().openDetail({ kind: "doc", file }),
  );

  useFrame((_, dt) => {
    if (lift.current)
      lift.current.position.y = THREE.MathUtils.damp(
        lift.current.position.y,
        hovered ? 0.06 : 0,
        10,
        dt,
      );
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh ref={hit} visible={false} position={[0, 0.05, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.6]} />
        <meshBasicMaterial />
      </mesh>

      <group ref={lift}>
        {/* back cover, papers, front cover, tab */}
        <mesh position={[0, 0.006, 0]}>
          <boxGeometry args={[0.32, 0.012, 0.42]} />
          <meshStandardMaterial
            color={file.color}
            roughness={0.7}
            emissive={file.color}
            emissiveIntensity={hovered ? 0.35 : 0}
          />
        </mesh>
        <mesh position={[0, 0.014, 0.012]}>
          <boxGeometry args={[0.3, 0.008, 0.4]} />
          <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.021, 0.02]}>
          <boxGeometry args={[0.32, 0.01, 0.4]} />
          <meshStandardMaterial
            color={file.color}
            roughness={0.7}
            emissive={file.color}
            emissiveIntensity={hovered ? 0.35 : 0}
          />
        </mesh>
        <mesh position={[0.08, 0.021, -0.205]}>
          <boxGeometry args={[0.12, 0.01, 0.04]} />
          <meshStandardMaterial color={file.color} roughness={0.7} />
        </mesh>
        <Text
          position={[0, 0.0275, 0.03]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          letterSpacing={0.1}
          color="#2a1d0a"
          anchorX="center"
          anchorY="middle"
        >
          {file.label}
        </Text>
      </group>
    </group>
  );
}
