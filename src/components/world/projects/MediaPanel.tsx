"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import type { Project, ProjectMedia } from "@/data/types";
import { useImageTexture } from "@/hooks/useImageTexture";
import { useInteractable } from "@/hooks/useInteractable";
import { mediaThumb } from "@/lib/cloudinary";
import { playerPos } from "@/lib/player";
import { useGameStore } from "@/store/useGameStore";
import HoloFrame from "./HoloFrame";

type Props = {
  project: Project;
  media: ProjectMedia; // an image, or a video shown as a still
  mediaIndex: number;
  position: [number, number, number]; // in the bay's local space
  width: number;
  height: number;
  worldX: number;
  worldZ: number;
  color: string;
};

const contain = (aspect: number, w: number, h: number): [number, number] =>
  aspect > w / h ? [w, w / aspect] : [h * aspect, h];

/** A framed picture on the wall. Click it to open the full-size viewer (videos show a play badge). */
export default function MediaPanel({
  project,
  media,
  mediaIndex,
  position,
  width,
  height,
  worldX,
  worldZ,
  color,
}: Props) {
  const id = `media:${project.id}:${mediaIndex}`;
  const [activated, setActivated] = useState(false);
  const hit = useRef<THREE.Mesh>(null);
  const hovered = useGameStore((s) => s.hover?.id === id);
  const isVideo = media.type === "video";

  const url = useMemo(() => mediaThumb(media, 900) || null, [media]);
  const img = useImageTexture(url, activated);

  const label = media.caption ?? project.label;
  useInteractable(hit, id, `${isVideo ? "Watch" : "View"}: ${label}`, () =>
    useGameStore
      .getState()
      .openDetail({ kind: "media", project, index: mediaIndex }),
  );

  useFrame(() => {
    if (
      !activated &&
      Math.hypot(playerPos.x - worldX, playerPos.z - worldZ) < 20
    )
      setActivated(true);
  });

  const [fw, fh] = contain(img.aspect, width, height);

  return (
    <group position={position}>
      <mesh ref={hit} visible={false}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial />
      </mesh>

      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#04070c" />
      </mesh>

      <mesh>
        <planeGeometry args={[fw, fh]} />
        <meshBasicMaterial
          key={img.tex ? "tex" : "none"}
          map={img.tex ?? undefined}
          color={img.tex ? "#ffffff" : "#0d1622"}
          toneMapped={false}
        />
      </mesh>

      <HoloFrame w={width} h={height} color={color} hovered={hovered} />

      {isVideo && (
        <mesh position={[0, 0, 0.02]} rotation={[0, 0, -Math.PI / 2]}>
          <circleGeometry args={[0.17, 3]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      )}

      <Text
        position={[0, -height / 2 - 0.16, 0.02]}
        fontSize={0.1}
        letterSpacing={0.1}
        color={hovered ? "#ffffff" : color}
        anchorX="center"
        anchorY="middle"
        maxWidth={width}
      >
        {img.status === "failed" ? "UNAVAILABLE" : label.toUpperCase()}
      </Text>
    </group>
  );
}
