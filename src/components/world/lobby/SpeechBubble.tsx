"use client";

import { Billboard, Text } from "@react-three/drei";
import { GOLD } from "@/constants/world";

type Props = { text: string | null; position: [number, number, number] };

/** Floating dialogue bubble that always faces the camera. */
export default function SpeechBubble({ text, position }: Props) {
  if (!text) return null;

  const maxW = 2.6;
  const lines = Math.max(1, Math.ceil((text.length * 0.09) / maxW));
  const w = Math.min(maxW, text.length * 0.09) + 0.4;
  const h = lines * 0.2 + 0.25;

  return (
    <Billboard position={position}>
      <mesh renderOrder={10}>
        <planeGeometry args={[w + 0.04, h + 0.04]} />
        <meshBasicMaterial
          color={GOLD}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <mesh renderOrder={11} position={[0, 0, 0.002]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial
          color="#14110e"
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>
      <Text
        renderOrder={12}
        position={[0, 0, 0.004]}
        fontSize={0.14}
        maxWidth={maxW}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#f4ede0"
      >
        {text}
      </Text>
    </Billboard>
  );
}
