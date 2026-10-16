"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import type { ProjectSlot } from "@/constants/rooms";
import { PROJECTS_H } from "@/constants/rooms";
import Hologram from "@/components/world/holograms/Hologram";
import { useGameStore } from "@/store/useGameStore";
import MediaPanel from "./MediaPanel";
import MediaScreen from "./MediaScreen";

const PANEL_W = 9.6;
const PANEL_H = 5.0;
const HERO = { w: 4.8, h: 2.7, y: 3.75 };
const ROW = { w: 1.55, h: 1.1, gap: 1.75, y: 1.55 };
const MAX_ROW = 5;

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

/**
 * Everything for one project: a display wall (video + picture row), its hologram, and the floor
 * decoration that leads to it. All positions come from the slot, so nothing here needs editing per project.
 */
export default function ProjectBay({
  slot,
  index,
}: {
  slot: ProjectSlot;
  index: number;
}) {
  const { project, side, bayZ, wallX, plinthX } = slot;
  const color = project.color;
  const media = project.media ?? [];

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

  // local x runs along the wall; for the left wall it points to -z, for the right wall to +z
  const worldZ = (lx: number) => bayZ + side * lx;
  const worldX = wallX - side * 1; // roughly where the screens are, for load distances
  const rotY = side < 0 ? Math.PI / 2 : -Math.PI / 2; // local +z faces into the room

  const openHologram = () =>
    useGameStore.getState().openDetail({ kind: "project", project });

  return (
    <>
      {/* the display wall, in the wall's own space */}
      <group position={[wallX - side * 0.05, 0, bayZ]} rotation={[0, rotY, 0]}>
        <mesh position={[0, 3.1, 0.03]}>
          <boxGeometry args={[PANEL_W, PANEL_H, 0.06]} />
          <meshStandardMaterial
            color="#0a1018"
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
        {/* glowing edge strips */}
        {[-PANEL_W / 2, PANEL_W / 2].map((x) => (
          <mesh key={x} position={[x, 3.1, 0.07]}>
            <boxGeometry args={[0.05, PANEL_H, 0.04]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        ))}

        <Text
          position={[-PANEL_W / 2 + 0.4, 5.35, 0.09]}
          fontSize={0.3}
          letterSpacing={0.1}
          color={color}
          anchorX="left"
          anchorY="middle"
        >
          {String(index + 1).padStart(2, "0")}
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
              worldX={worldX}
              worldZ={bayZ}
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
              worldX={worldX}
              worldZ={bayZ}
              color={color}
            />
          ))}

        {rest.map(({ m, i }, k) => {
          const lx = (k - (rest.length - 1) / 2) * ROW.gap;
          return (
            <MediaPanel
              key={`${m.src}-${i}`}
              project={project}
              media={m}
              mediaIndex={i}
              position={[lx, ROW.y, 0.1]}
              width={ROW.w}
              height={ROW.h}
              worldX={worldX}
              worldZ={worldZ(lx)}
              color={color}
            />
          );
        })}

        {!hero && (
          <Text
            position={[0, 3.4, 0.1]}
            fontSize={0.24}
            letterSpacing={0.3}
            color="#9fb4c8"
            anchorX="center"
            anchorY="middle"
          >
            MEDIA COMING SOON
          </Text>
        )}
      </group>

      {/* hologram pedestal, floor decoration, and a circuit line from the aisle to it */}
      <Hologram
        id={`project:${project.id}`}
        x={plinthX}
        z={bayZ}
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
      <FloorBeacon x={plinthX} z={bayZ} color={color} height={PROJECTS_H} />
      <mesh position={[plinthX / 2, 0.012, bayZ]}>
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
