"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import Hologram from "@/components/world/holograms/Hologram";
import { PROJECTS_H, PROJECTS_ROOM, type ProjectSlot } from "@/constants/rooms";
import type { Project } from "@/data/types";
import { useInteractable } from "@/hooks/useInteractable";
import { useGameStore } from "@/store/useGameStore";
import HoloFrame from "./HoloFrame";
import MediaPanel from "./MediaPanel";
import MediaScreen from "./MediaScreen";

const PANEL_W = 9.6;
const PANEL_H = 5.0;
const HERO = { w: 4.8, h: 2.7, y: 3.75 };
const ROW = { w: 1.55, h: 1.1, gap: 1.75, y: 1.55 };
const MAX_ROW = 5;

const hostOf = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * Where a display wall sits. `pos` / `rotY` put its local space on the wall (local +z faces into the room,
 * local x runs along the wall), and `world(lx)` converts a local x into room coordinates.
 */
function wallPlacement(slot: ProjectSlot) {
  const { width: W, depth: D } = PROJECTS_ROOM;
  if (slot.wall === "left") {
    return {
      pos: [-W / 2 + 0.05, 0, slot.along] as [number, number, number],
      rotY: Math.PI / 2,
      world: (lx: number): [number, number] => [-W / 2, slot.along - lx],
    };
  }
  if (slot.wall === "right") {
    return {
      pos: [W / 2 - 0.05, 0, slot.along] as [number, number, number],
      rotY: -Math.PI / 2,
      world: (lx: number): [number, number] => [W / 2, slot.along + lx],
    };
  }
  return {
    pos: [slot.along, 0, -D / 2 + 0.05] as [number, number, number],
    rotY: 0,
    world: (lx: number): [number, number] => [slot.along + lx, -D / 2],
  };
}

/** Floor ring, pulsing ring and a faint light beam around the hologram pedestal. */
function FloorBeacon({
  x,
  z,
  color,
  height,
}: {
  x: number;
  z: number;
  color: string;
  height: number;
}) {
  const pulse = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const t = (clock.elapsedTime * 0.6) % 1;
    pulse.current.scale.setScalar(1 + t * 0.9);
    (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - t);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.2, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      </mesh>
      <mesh
        ref={pulse}
        position={[0, 0.021, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[1.05, 1.12, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.72, 0.72, height, 24, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** A glowing plaque showing the project's web address. Aim at it to open the project card (with the Visit button). */
function LinkPlaque({
  project,
  x,
  color,
}: {
  project: Project;
  x: number;
  color: string;
}) {
  const id = `plaque:${project.id}`;
  const hit = useRef<THREE.Mesh>(null);
  const hovered = useGameStore((s) => s.hover?.id === id);

  useInteractable(hit, id, `Open: ${project.label}`, () =>
    useGameStore.getState().openDetail({ kind: "project", project }),
  );

  return (
    <group position={[x, 3.2, 0.1]}>
      <mesh ref={hit}>
        <planeGeometry args={[3.8, 2.3]} />
        <meshStandardMaterial
          color="#0a1018"
          metalness={0.5}
          roughness={0.25}
        />
      </mesh>
      <HoloFrame w={3.8} h={2.3} color={color} hovered={hovered} />
      <Text
        position={[0, 0.62, 0.02]}
        fontSize={0.15}
        letterSpacing={0.3}
        color="#9fb4c8"
        anchorX="center"
        anchorY="middle"
      >
        VISIT THE LIVE SITE
      </Text>
      <Text
        position={[0, 0.05, 0.02]}
        fontSize={0.3}
        maxWidth={3.5}
        textAlign="center"
        letterSpacing={0.02}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {hostOf(project.link?.url)}
      </Text>
      <Text
        position={[0, -0.7, 0.02]}
        fontSize={0.12}
        letterSpacing={0.2}
        color={hovered ? "#ffffff" : "#9fb4c8"}
        anchorX="center"
        anchorY="middle"
      >
        {hovered ? "CLICK TO OPEN" : "ONLINE NOW"}
      </Text>
    </group>
  );
}

/**
 * Everything for one project: a display wall (video + picture row), its hologram, and the floor
 * decoration that leads to it. Works on the left, right or front wall; positions come from the slot.
 */
export default function ProjectBay({
  slot,
  index,
}: {
  slot: ProjectSlot;
  index: number;
}) {
  const { project, plinthX, plinthZ, featured } = slot;
  const color = project.color;
  const media = project.media ?? [];
  const place = wallPlacement(slot);

  // the first video is the big screen; with no video, the first image takes that place
  const heroIndex = Math.max(
    0,
    media.findIndex((m) => m.type === "video"),
  );
  const hero = media.length ? { m: media[heroIndex], i: heroIndex } : null;
  const rest = media
    .map((m, i) => ({ m, i }))
    .filter((x) => x.i !== hero?.i)
    .slice(0, MAX_ROW);

  const [heroX, heroZ] = place.world(0);
  const openHologram = () =>
    useGameStore.getState().openDetail({ kind: "project", project });

  return (
    <>
      {/* the display wall, in the wall's own space */}
      <group position={place.pos} rotation={[0, place.rotY, 0]}>
        <mesh position={[0, 3.1, 0.03]}>
          <boxGeometry args={[PANEL_W, PANEL_H, 0.06]} />
          <meshStandardMaterial
            color="#0a1018"
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        {[-PANEL_W / 2, PANEL_W / 2].map((x) => (
          <mesh key={x} position={[x, 3.1, 0.07]}>
            <boxGeometry args={[0.05, PANEL_H, 0.04]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        ))}

        <Text
          position={[-PANEL_W / 2 + 0.4, 5.35, 0.09]}
          fontSize={featured ? 0.15 : 0.3}
          letterSpacing={0.12}
          color={color}
          anchorX="left"
          anchorY="middle"
        >
          {featured ? "FEATURED PROJECT" : String(index + 1).padStart(2, "0")}
        </Text>
        <Text
          position={[0, 5.35, 0.09]}
          fontSize={0.3}
          letterSpacing={0.12}
          color="#e8f4ff"
          anchorX="center"
          anchorY="middle"
        >
          {project.label.toUpperCase()}
        </Text>
        <Text
          position={[PANEL_W / 2 - 0.4, 5.35, 0.09]}
          fontSize={0.12}
          letterSpacing={0.2}
          color="#9fb4c8"
          anchorX="right"
          anchorY="middle"
        >
          {project.kind.toUpperCase()}
        </Text>

        {hero &&
          (hero.m.type === "video" ? (
            <MediaScreen
              project={project}
              media={hero.m}
              mediaIndex={hero.i}
              position={[0, HERO.y, 0.1]}
              width={HERO.w}
              height={HERO.h}
              worldX={heroX}
              worldZ={heroZ}
              color={color}
            />
          ) : (
            <MediaPanel
              project={project}
              media={hero.m}
              mediaIndex={hero.i}
              position={[0, HERO.y, 0.1]}
              width={HERO.w}
              height={HERO.h}
              worldX={heroX}
              worldZ={heroZ}
              color={color}
            />
          ))}

        {rest.map(({ m, i }, k) => {
          const lx = (k - (rest.length - 1) / 2) * ROW.gap;
          const [wx, wz] = place.world(lx);
          return (
            <MediaPanel
              key={`${m.src}-${i}`}
              project={project}
              media={m}
              mediaIndex={i}
              position={[lx, ROW.y, 0.1]}
              width={ROW.w}
              height={ROW.h}
              worldX={wx}
              worldZ={wz}
              color={color}
            />
          );
        })}

        {/* no media yet: show the tagline instead of an empty wall */}
        {!hero && (
          <>
            <Text
              position={[0, 3.9, 0.1]}
              fontSize={0.34}
              maxWidth={7.6}
              textAlign="center"
              letterSpacing={0.04}
              color={color}
              anchorX="center"
              anchorY="middle"
            >
              {project.tagline}
            </Text>
            <Text
              position={[0, 2.5, 0.1]}
              fontSize={0.14}
              letterSpacing={0.3}
              color="#9fb4c8"
              anchorX="center"
              anchorY="middle"
            >
              MEDIA COMING SOON
            </Text>
          </>
        )}

        {/* on the front wall, a plaque with the web address on the left-hand side */}
        {featured && project.link && (
          <LinkPlaque project={project} x={-6.9} color={color} />
        )}
      </group>

      {/* hologram pedestal, floor decoration, and a circuit line from the aisle to it */}
      <Hologram
        id={`project:${project.id}`}
        x={plinthX}
        z={plinthZ}
        scale={1.35}
        variant="tech"
        name={project.label}
        subtitle={project.kind}
        color={color}
        logo={project.logo}
        badge={project.badge}
        interactLabel={`View ${project.label}`}
        onActivate={openHologram}
      />
      <FloorBeacon x={plinthX} z={plinthZ} color={color} height={PROJECTS_H} />
      <mesh position={[plinthX / 2, 0.012, plinthZ]}>
        <boxGeometry args={[Math.abs(plinthX), 0.01, 0.06]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
