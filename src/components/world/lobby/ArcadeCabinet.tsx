"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

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
import { arcadeRuntime } from "./arcadeRuntime";

const W = 256;
const H = 192;

// ---------------------------------------------------------------------------------------------
// The cabinet body is built ONCE as a single merged geometry (one draw call) and shared by all
// cabinets. The neon trim is a second shared geometry that only changes colour per cabinet.
// ---------------------------------------------------------------------------------------------
function tinted(geo: THREE.BufferGeometry, hex: string) {
  const c = new THREE.Color(hex);
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

function buildBody() {
  const T = (
    g: THREE.BufferGeometry,
    hex: string,
    fn: (g: THREE.BufferGeometry) => void,
  ) => {
    fn(g);
    return tinted(g, hex);
  };
  const parts = [
    T(box(0.06, 1.85, 0.9), "#16131f", (g) => g.translate(-0.395, 0.925, 0)), // sides
    T(box(0.06, 1.85, 0.9), "#16131f", (g) => g.translate(0.395, 0.925, 0)),
    T(box(0.85, 1.85, 0.05), "#16131f", (g) => g.translate(0, 0.925, -0.425)), // back
    T(box(0.73, 0.85, 0.8), "#1d1a29", (g) => g.translate(0, 0.425, 0.02)), // lower front
    T(box(0.26, 0.3, 0.02), "#2a2a33", (g) => g.translate(0, 0.45, 0.425)), // coin door
    T(box(0.08, 0.012, 0.004), "#ffd23f", (g) => g.translate(0, 0.5, 0.437)), // coin slot
    T(box(0.73, 0.07, 0.45), "#26223a", (g) => {
      g.rotateX(0.25);
      g.translate(0, 0.93, 0.5);
    }), // control panel
    T(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), "#aaaaaa", (g) => {
      g.translate(0, 0.07, 0);
      g.rotateX(0.25);
      g.translate(-0.17, 0.98, 0.5);
    }), // joystick
    T(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12), "#43d17a", (g) => {
      g.rotateX(0.25);
      g.translate(0.1, 0.975, 0.5);
    }),
    T(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12), "#ff5252", (g) => {
      g.rotateX(0.25);
      g.translate(0.2, 0.975, 0.5);
    }),
    T(box(0.73, 0.58, 0.14), "#0b0b10", (g) => {
      g.rotateX(-0.1);
      g.translate(0, 1.34, 0.17);
    }), // screen bezel
    T(box(0.73, 0.2, 0.2), "#0d1118", (g) => g.translate(0, 1.74, 0.18)), // marquee box
  ];
  return mergeGeometries(parts, false)!;
}

function buildTrim() {
  const ball = new THREE.SphereGeometry(0.04, 12, 8);
  ball.translate(0, 0.15, 0);
  ball.rotateX(0.25);
  ball.translate(-0.17, 0.98, 0.5);
  const strip = (x: number) => {
    const g = box(0.008, 1.7, 0.03);
    g.translate(x, 0.925, 0.2);
    return g;
  };
  const under = box(0.7, 0.01, 0.004);
  under.translate(0, 1.63, 0.285);
  return mergeGeometries([strip(-0.428), strip(0.428), under, ball], false)!;
}

let bodyGeo: THREE.BufferGeometry | null = null;
let trimGeo: THREE.BufferGeometry | null = null;
let bodyMat: THREE.MeshStandardMaterial | null = null;
let glowTex: THREE.Texture | null = null;
const getBody = () => (bodyGeo ??= buildBody());
const getTrim = () => (trimGeo ??= buildTrim());
const getBodyMat = () =>
  (bodyMat ??= new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.55,
    metalness: 0.15,
  }));
const getGlow = () => (glowTex ??= createGlowTexture());

/** The marquee text is drawn once into a texture (no 3D text = no text-renderer cost). */
function makeMarquee(text: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#0d1118";
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${text.length > 5 ? 38 : 48}px monospace`;
  ctx.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface Props {
  id: ArcadeGameId;
  title: string;
  marquee: string;
  color: string;
  z: number;
  /** position in the row: cabinets repaint their screens in turns */
  slot: number;
}

/** One retro cabinet. Its screen plays an attract animation and shows that game's #1 score. Aim and press USE / E. */
export default function ArcadeCabinet({
  id,
  title,
  marquee,
  color,
  z,
  slot,
}: Props) {
  const hit = useRef<THREE.Mesh>(null);
  const topRef = useRef<{ name: string; score: number } | null>(null);
  const detail = useGameStore((s) => s.detail);
  const offset = useMemo(() => z * 3.1, [z]);

  const screen = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    // no mipmaps: re-uploading a screen several times a second is much cheaper without them
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    return { canvas: c, texture: t };
  }, []);
  const marqueeTex = useMemo(
    () => makeMarquee(marquee, color),
    [marquee, color],
  );
  useEffect(() => () => screen.texture.dispose(), [screen]);
  useEffect(() => () => marqueeTex.dispose(), [marqueeTex]);

  const paint = useCallback(
    (t: number) => {
      const ctx = screen.canvas.getContext("2d");
      if (!ctx) return;
      drawAttract(id, ctx, t, W, H);
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
      if (Math.floor(t * 2) % 2) {
        ctx.fillStyle = "#e8f5ee";
        ctx.fillText("PRESS USE TO PLAY", W / 2, H - 9);
      }
      screen.texture.needsUpdate = true;
    },
    [id, color, marquee, screen],
  );

  // one paint on mount so the screen is never blank
  useEffect(() => paint(offset), [paint, offset]);

  // fetch this game's #1 score when the lobby shows, and again after the arcade closes
  useEffect(() => {
    if (detail) return;
    let live = true;
    fetch(`/api/arcade/scores?game=${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { top?: { name: string; score: number }[] }) => {
        if (live) topRef.current = d.top?.[0] ?? null;
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
    if (!arcadeRuntime.visible) return; // the corner is off-screen: do nothing
    if ((arcadeRuntime.frame + slot) % arcadeRuntime.interval !== 0) return; // not this cabinet's turn
    if (Math.hypot(playerPos.x - ARCADE_WALL_X, playerPos.z - z) > 16) return; // too far to see
    paint(clock.elapsedTime + offset);
  });

  return (
    <group position={[ARCADE_WALL_X, 0, z]} rotation={[0, ARCADE_ROT, 0]}>
      {/* glow on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.5]}>
        <planeGeometry args={[1.8, 1.8]} />
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

      {/* body + trim: two draw calls for the whole cabinet */}
      <mesh geometry={getBody()} material={getBodyMat()} />
      <mesh geometry={getTrim()}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* screen + marquee */}
      <mesh position={[0, 1.34, 0.245]} rotation={[-0.1, 0, 0]}>
        <planeGeometry args={[0.6, 0.45]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.74, 0.282]}>
        <planeGeometry args={[0.66, 0.165]} />
        <meshBasicMaterial map={marqueeTex} toneMapped={false} />
      </mesh>

      {/* invisible hit box: what the crosshair aims at */}
      <mesh ref={hit} position={[0, 1, 0.1]}>
        <boxGeometry args={[0.95, 2, 1.1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
