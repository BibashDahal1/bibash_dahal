"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  ARCADE_CABINETS,
  ARCADE_CENTER_Z,
  ARCADE_COLLIDERS,
  ARCADE_LENGTH,
  ARCADE_WALL_X,
  PLAYER_PAD,
} from "@/constants/arcade";
import { playerPos } from "@/lib/player";
import { useGameStore } from "@/store/useGameStore";
import ArcadeCabinet from "./ArcadeCabinet";
import { arcadeRuntime } from "./arcadeRuntime";

/** Dark carpet with scattered neon shapes, the classic arcade look. */
function createArcadeCarpet(repeatX: number, repeatY: number) {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0d0820";
  ctx.fillRect(0, 0, S, S);

  let a = 1234;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const colors = ["#ff4de1", "#5eeaff", "#ffd23f", "#7dff9a"];
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 38; i++) {
    const x = rand() * S;
    const y = rand() * S;
    ctx.strokeStyle = colors[i % colors.length];
    ctx.beginPath();
    const k = i % 3;
    if (k === 0) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + 18, y + 6);
      ctx.lineTo(x + 6, y + 20);
      ctx.closePath();
    } else if (k === 1) {
      ctx.arc(x, y, 7 + rand() * 6, 0, Math.PI * 2);
    } else {
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 10, y - 12, x + 20, y + 12, x + 30, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The neon "ARCADE" sign, drawn once into a texture (glow included), so no 3D text is needed. */
function createSignTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 1024, 320);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "bold 170px monospace";
  ctx.shadowColor = "#ff2fd0";
  ctx.shadowBlur = 40;
  ctx.fillStyle = "#ff7ae8";
  ctx.fillText("ARCADE", 512, 150);
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffd6f7";
  ctx.fillText("ARCADE", 512, 150);

  ctx.font = "bold 52px monospace";
  ctx.shadowColor = "#ffd23f";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffd23f";
  ctx.fillText("INSERT COIN", 512, 268);

  ctx.shadowColor = "#5eeaff";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#5eeaff";
  ctx.fillRect(60, 18, 904, 6);
  ctx.fillRect(60, 300, 904, 6);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const RUG_W = 3.2;

/**
 * The arcade section of the lobby: neon sign, carpet, the row of cabinets and their collision.
 * Collision is self-contained: every frame the visitor is pushed out of the (padded) cabinet footprints,
 * so they slide along the row instead of walking through it.
 */
export default function ArcadeCorner() {
  const quality = useGameStore((s) => s.quality);
  const rugLen = ARCADE_LENGTH + 0.4;
  const carpet = useMemo(
    () => createArcadeCarpet(RUG_W / 2, rugLen / 2),
    [rugLen],
  );
  const sign = useMemo(() => createSignTexture(), []);
  useEffect(() => () => carpet.dispose(), [carpet]);
  useEffect(() => () => sign.dispose(), [sign]);

  // for "is the corner on screen?" (checked a few times a second, not every frame)
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const sphere = useMemo(
    () =>
      new THREE.Sphere(
        new THREE.Vector3(ARCADE_WALL_X + 0.6, 1.4, ARCADE_CENTER_Z),
        ARCADE_LENGTH / 2 + 1.6,
      ),
    [],
  );

  useFrame(({ camera }) => {
    arcadeRuntime.frame++;
    arcadeRuntime.interval = quality === "high" ? 6 : 10;
    if (arcadeRuntime.frame % 8 === 0) {
      m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(m4);
      arcadeRuntime.visible = frustum.intersectsSphere(sphere);
    }

    // collision: only do the work when the visitor is near the row
    if (playerPos.x > ARCADE_WALL_X + 3 || playerPos.x < ARCADE_WALL_X - 3)
      return;
    for (const r of ARCADE_COLLIDERS) {
      const hw = r.hw + PLAYER_PAD;
      const hd = r.hd + PLAYER_PAD;
      const dx = playerPos.x - r.cx;
      const dz = playerPos.z - r.cz;
      if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
        // push out along the axis with the smaller overlap
        if (hw - Math.abs(dx) < hd - Math.abs(dz))
          playerPos.x = r.cx + (dx >= 0 ? hw : -hw);
        else playerPos.z = r.cz + (dz >= 0 ? hd : -hd);
      }
    }
  });

  const rugX = ARCADE_WALL_X + 1.0;

  return (
    <group>
      {/* carpet with a neon border */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[rugX, 0.012, ARCADE_CENTER_Z]}
      >
        <planeGeometry args={[RUG_W, rugLen]} />
        <meshStandardMaterial map={carpet} roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={`z${s}`}
          position={[rugX + s * (RUG_W / 2 - 0.03), 0.02, ARCADE_CENTER_Z]}
        >
          <boxGeometry args={[0.04, 0.006, rugLen]} />
          <meshBasicMaterial
            color={s < 0 ? "#ff4de1" : "#5eeaff"}
            toneMapped={false}
          />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh
          key={`x${s}`}
          position={[rugX, 0.02, ARCADE_CENTER_Z + s * (rugLen / 2 - 0.03)]}
        >
          <boxGeometry args={[RUG_W, 0.006, 0.04]} />
          <meshBasicMaterial color="#ffd23f" toneMapped={false} />
        </mesh>
      ))}

      {/* neon sign on the wall */}
      <mesh
        position={[ARCADE_WALL_X - 0.42, 3.4, ARCADE_CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[2.6, 0.8125]} />
        <meshBasicMaterial
          map={sign}
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {ARCADE_CABINETS.map((c, i) => (
        <ArcadeCabinet
          key={c.id}
          id={c.id}
          title={c.title}
          marquee={c.marquee}
          color={c.color}
          z={c.z}
          slot={i}
        />
      ))}
    </group>
  );
}
