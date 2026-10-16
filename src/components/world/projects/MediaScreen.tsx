"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import { QUALITY } from "@/constants/quality";
import type { Project, ProjectMedia } from "@/data/types";
import { useImageTexture } from "@/hooks/useImageTexture";
import { useInteractable } from "@/hooks/useInteractable";
import { useVideoTexture } from "@/hooks/useVideoTexture";
import { imageUrl, videoSources } from "@/lib/cloudinary";
import { playerPos } from "@/lib/player";
import { release, requestPlay } from "@/lib/videoPool";
import { useGameStore } from "@/store/useGameStore";
import HoloFrame from "./HoloFrame";

type Props = {
  project: Project;
  media: ProjectMedia; // a video
  mediaIndex: number; // its index in project.media
  position: [number, number, number]; // in the bay's local space
  width: number;
  height: number;
  worldX: number; // where it is in the room, to decide when to load and play
  worldZ: number;
  color: string;
};

const contain = (aspect: number, w: number, h: number): [number, number] =>
  aspect > w / h ? [w, w / aspect] : [h * aspect, h];

/**
 * A wall screen playing a project video (muted, looping). It only downloads once you get near,
 * and only a couple of screens play at a time. Click it for the full viewer with sound.
 */
export default function MediaScreen({
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
  const quality = useGameStore((s) => s.quality);

  const sources = useMemo(() => videoSources(media.src, 960), [media.src]);
  const posterUrl = media.poster
    ? imageUrl(media.poster, 960)
    : (sources.poster ?? null);
  const poster = useImageTexture(posterUrl, activated);
  const vid = useVideoTexture(sources.video, activated);

  useInteractable(hit, id, `Watch: ${project.label}`, () =>
    useGameStore
      .getState()
      .openDetail({ kind: "media", project, index: mediaIndex }),
  );

  useFrame(() => {
    const d = Math.hypot(playerPos.x - worldX, playerPos.z - worldZ);
    if (!activated && d < 22) setActivated(true);
    if (!vid.video) return;
    if (d < 14 && useGameStore.getState().phase !== "viewing")
      requestPlay(id, vid.video, QUALITY[quality].videos);
    else release(id);
  });
  useEffect(() => () => release(id), [id]);

  const showVideo = vid.playing && !vid.failed;
  const tex = showVideo ? vid.texture : poster.tex;
  const aspect = showVideo ? vid.aspect : poster.aspect;
  const [fw, fh] = contain(aspect, width, height);
  const unavailable = vid.failed && poster.status === "failed";

  return (
    <group position={position}>
      {/* invisible full-size target, so aiming is forgiving */}
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
          key={showVideo ? "video" : tex ? "poster" : "none"}
          map={tex ?? undefined}
          color={tex ? "#ffffff" : "#0d1622"}
          toneMapped={false}
        />
      </mesh>

      <HoloFrame w={width} h={height} color={color} hovered={hovered} />

      {/* play badge */}
      <mesh
        position={[-width / 2 + 0.2, -height / 2 + 0.2, 0.02]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <circleGeometry args={[0.1, 3]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Text
        position={[-width / 2 + 0.4, -height / 2 + 0.2, 0.02]}
        fontSize={0.12}
        letterSpacing={0.15}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {unavailable
          ? "VIDEO UNAVAILABLE"
          : hovered
            ? "CLICK TO OPEN"
            : (media.caption ?? "VIDEO").toUpperCase()}
      </Text>
    </group>
  );
}
