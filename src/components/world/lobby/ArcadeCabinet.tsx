"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

import { ARCADE } from "@/constants/arcade";
import { useInteractable } from "@/hooks/useInteractable";
import { playerPos } from "@/lib/player";
import { createGlowTexture } from "@/lib/textures";
import { useGameStore } from "@/store/useGameStore";

const W = 256;
const H = 192;
const CELL = 16;
const COLS = W / CELL; // 16
const ROWS = H / CELL; // 12

let sharedGlow: THREE.Texture | null = null;
const getGlow = () => (sharedGlow ??= createGlowTexture());

/** A loop of cells the attract-mode snake follows. */
function buildPath() {
  const p: { x: number; y: number }[] = [];
  for (let x = 2; x <= 13; x++) p.push({ x, y: 3 });
  for (let y = 4; y <= 9; y++) p.push({ x: 13, y });
  for (let x = 12; x >= 2; x--) p.push({ x, y: 9 });
  for (let y = 8; y >= 4; y--) p.push({ x: 2, y });
  return p;
}

/**
 * A retro snake arcade cabinet. The screen plays an attract-mode snake and shows the current #1 score.
 * Aim at it and press USE / E to play.
 */
export default function ArcadeCabinet() {
  const hit = useRef<THREE.Mesh>(null);
  const path = useMemo(buildPath, []);
  const topRef = useRef<{ name: string; score: number } | null>(null);
  const last = useRef({ step: -1, blink: -1 });
  const detail = useGameStore((s) => s.detail);

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, texture: t };
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  // fetch the #1 score when the lobby shows, and again after the arcade closes
  useEffect(() => {
    if (detail) return;
    let live = true;
    fetch("/api/snake/scores")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { top?: { name: string; score: number }[] }) => {
        if (live) topRef.current = d.top?.[0] ?? null;
        last.current.step = -1; // force a redraw
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [detail]);

  useInteractable(hit, "arcade:snake", "Play SNAKE arcade", () => {
    const s = useGameStore.getState();
    if (s.phase === "explore") s.openDetail({ kind: "arcade" });
  });

  useFrame(({ clock }) => {
    // only animate the screen while the visitor is nearby
    if (Math.hypot(playerPos.x - ARCADE.x, playerPos.z - ARCADE.z) > 18) return;
    const t = clock.elapsedTime;
    const step = Math.floor(t * 9);
    const blink = Math.floor(t * 2) % 2;
    if (step === last.current.step && blink === last.current.blink) return;
    last.current = { step, blink };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#031009";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(90,255,150,0.08)";
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++)
        ctx.fillRect(x * CELL + 7, y * CELL + 7, 2, 2);

    const n = path.length;
    const foodIdx = (Math.floor(step / 12) * 12 + 12) % n;
    const f = path[foodIdx];
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(f.x * CELL + 3, f.y * CELL + 3, CELL - 6, CELL - 6);

    for (let i = 8; i >= 0; i--) {
      const c = path[(((step - i) % n) + n) % n];
      ctx.fillStyle =
        i === 0 ? "#c9ffd9" : `hsl(140,80%,${Math.max(30, 52 - i * 3)}%)`;
      ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#7dff9a";
    ctx.font = "bold 20px monospace";
    ctx.fillText("SNAKE", W / 2, 24);
    ctx.font = "bold 13px monospace";
    const top = topRef.current;
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(
      top
        ? `HI ${top.name.slice(0, 10).toUpperCase()} ${top.score}`
        : "NO HI-SCORE YET",
      W / 2,
      46,
    );
    if (blink) {
      ctx.fillStyle = "#c9ffd9";
      ctx.fillText("PRESS USE TO PLAY", W / 2, H - 12);
    }
    texture.needsUpdate = true;
  });

  const body = "#16131f";
  const trim = "#7dff9a";

  return (
    <group position={[ARCADE.x, 0, ARCADE.z]} rotation={[0, ARCADE.rotY, 0]}>
      {/* glow on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0.5]}>
        <planeGeometry args={[2.4, 2.4]} />
        <meshBasicMaterial
          map={getGlow()}
          color="#4dff88"
          transparent
          opacity={0.3}
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
            <meshBasicMaterial color={trim} toneMapped={false} />
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
          <meshStandardMaterial color="#e53935" roughness={0.3} />
        </mesh>
      </group>
      {[
        [0.1, "#43d17a"],
        [0.2, "#ff5252"],
      ].map(([x, c]) => (
        <mesh
          key={String(c)}
          position={[x as number, 0.975, 0.5]}
          rotation={[0.25, 0, 0]}
        >
          <cylinderGeometry args={[0.032, 0.032, 0.03, 16]} />
          <meshStandardMaterial
            color={c as string}
            emissive={c as string}
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
        <meshStandardMaterial color="#0d1a14" roughness={0.5} />
      </mesh>
      <Text
        position={[0, 1.74, 0.285]}
        fontSize={0.11}
        letterSpacing={0.12}
        color={trim}
        anchorX="center"
        anchorY="middle"
      >
        SNAKE
      </Text>
      <mesh position={[0, 1.63, 0.285]}>
        <boxGeometry args={[0.7, 0.01, 0.004]} />
        <meshBasicMaterial color={trim} toneMapped={false} />
      </mesh>

      <pointLight
        position={[0, 1.3, 1]}
        color="#66ff99"
        intensity={5}
        distance={4}
        decay={2}
      />

      {/* invisible hit box: what the crosshair aims at */}
      <mesh ref={hit} position={[0, 1, 0.1]}>
        <boxGeometry args={[0.95, 2, 1.1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
