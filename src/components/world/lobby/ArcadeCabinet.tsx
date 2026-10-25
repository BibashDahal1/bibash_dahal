"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import {
  ARCADE_ROT,
  ARCADE_WALL_X,
  type ArcadeGameId,
} from "@/constants/arcade";
import { useInteractable } from "@/hooks/useInteractable";
import { drawAttract } from "@/lib/arcade/arcadeAttract";
import { playerPos } from "@/lib/player";
import { createGlowTexture } from "@/lib/textures";
import { useGameStore } from "@/store/useGameStore";

const W = 256;
const H = 192;

let sharedGlow: THREE.Texture | null = null;
const getGlow = () => (sharedGlow ??= createGlowTexture());

interface Props {
  id: ArcadeGameId;
  title: string;
  marquee: string;
  color: string;
  z: number;
}

/** One retro cabinet. Its screen plays an attract animation and shows that game's #1 score. Aim and press USE / E. */
export default function ArcadeCabinet({ id, title, marquee, color, z }: Props) {
  const hit = useRef<THREE.Mesh>(null);
  const topRef = useRef<{ name: string; score: number } | null>(null);
  const last = useRef({ step: -1, blink: -1 });
  const detail = useGameStore((s) => s.detail);
  const offset = useMemo(() => z * 3.1, [z]);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  // fetch this game's #1 score when the lobby shows, and again after the arcade closes
  useEffect(() => {
    if (detail) return;
    let live = true;
    fetch(`/api/arcade/scores?game=${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { top?: { name: string; score: number }[] }) => {
        if (live) topRef.current = d.top?.[0] ?? null;
        last.current.step = -1; // force a redraw
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [detail, id]);

  useInteractable(hit, `arcade:${id}`, `Play ${title}`, () => {
    const s = useGameStore.getState();
    if (s.phase === "explore") s.openDetail({ kind: "arcade", game: id });
  });

  useFrame(({ clock }) => {
    // only animate the screen while the visitor is nearby
    if (Math.hypot(playerPos.x - ARCADE_WALL_X, playerPos.z - z) > 18) return;
    const t = clock.elapsedTime + offset;
    const step = Math.floor(t * 12);
    const blink = Math.floor(t * 2) % 2;
    if (step === last.current.step && blink === last.current.blink) return;
    last.current = { step, blink };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAttract(id, ctx, t, W, H);

    // title / hi-score bars
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, 50);
    ctx.fillRect(0, H - 26, W, 26);
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.font = "bold 20px monospace";
    ctx.fillText(marquee, W / 2, 22);
    ctx.font = "bold 12px monospace";
    const top = topRef.current;
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(
      top
        ? `HI ${top.name.slice(0, 10).toUpperCase()} ${top.score}`
        : "NO HI-SCORE YET",
      W / 2,
      41,
    );
    if (blink) {
      ctx.fillStyle = "#e8f5ee";
      ctx.fillText("PRESS USE TO PLAY", W / 2, H - 9);
    }
    texture.needsUpdate = true;
  });

  const body = "#16131f";
  const titleSize = marquee.length > 5 ? 0.085 : 0.11;

  return (
    <group position={[ARCADE_WALL_X, 0, z]} rotation={[0, ARCADE_ROT, 0]}>
      {/* glow on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.5]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshBasicMaterial
          map={getGlow()}
          color={color}
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* side panels + neon edge */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.395, 0.925, 0]}>
            <boxGeometry args={[0.06, 1.85, 0.9]} />
            <meshStandardMaterial
              color={body}
              roughness={0.5}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[s * 0.428, 0.925, 0.2]}>
            <boxGeometry args={[0.008, 1.7, 0.03]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* back */}
      <mesh position={[0, 0.925, -0.425]}>
        <boxGeometry args={[0.85, 1.85, 0.05]} />
        <meshStandardMaterial color={body} roughness={0.6} />
      </mesh>
      {/* lower front box */}
      <mesh position={[0, 0.425, 0.02]}>
        <boxGeometry args={[0.73, 0.85, 0.8]} />
        <meshStandardMaterial
          color="#1d1a29"
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>
      {/* coin door */}
      <mesh position={[0, 0.45, 0.425]}>
        <boxGeometry args={[0.26, 0.3, 0.02]} />
        <meshStandardMaterial color="#2a2a33" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0.437]}>
        <boxGeometry args={[0.08, 0.012, 0.004]} />
        <meshBasicMaterial color="#ffd23f" toneMapped={false} />
      </mesh>

      {/* sloped control panel */}
      <mesh position={[0, 0.93, 0.5]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.73, 0.07, 0.45]} />
        <meshStandardMaterial
          color="#26223a"
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>
      <group position={[-0.17, 0.98, 0.5]} rotation={[0.25, 0, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
          <meshStandardMaterial
            color="#aaaaaa"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.04, 16, 12]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            roughness={0.3}
          />
        </mesh>
      </group>
      {[0.1, 0.2].map((x, i) => (
        <mesh key={x} position={[x, 0.975, 0.5]} rotation={[0.25, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.03, 16]} />
          <meshStandardMaterial
            color={i ? "#ff5252" : "#43d17a"}
            emissive={i ? "#ff5252" : "#43d17a"}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* screen bezel + screen */}
      <mesh position={[0, 1.34, 0.17]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[0.73, 0.58, 0.14]} />
        <meshStandardMaterial color="#0b0b10" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.34, 0.245]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[0.6, 0.45]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* marquee */}
      <mesh position={[0, 1.74, 0.18]}>
        <boxGeometry args={[0.73, 0.2, 0.2]} />
        <meshStandardMaterial color="#0d1118" roughness={0.5} />
      </mesh>
      <Text
        position={[0, 1.74, 0.285]}
        fontSize={titleSize}
        letterSpacing={0.1}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {marquee}
      </Text>
      <mesh position={[0, 1.63, 0.285]}>
        <boxGeometry args={[0.7, 0.01, 0.004]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* invisible hit box: what the crosshair aims at */}
      <mesh ref={hit} position={[0, 1, 0.1]}>
        <boxGeometry args={[0.95, 2, 1.1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
