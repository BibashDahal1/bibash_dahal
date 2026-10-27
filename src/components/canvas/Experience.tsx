"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

import PlayerController from "@/components/player/PlayerController";
import InteractionRaycaster from "@/components/world/interaction/InteractionRaycaster";
import Lobby from "@/components/world/lobby/Lobby";
import CertificatesRoom from "@/components/world/rooms/CertificatesRoom";
import OfficeRoom from "@/components/world/rooms/OfficeRoom";
import ProjectsRoom from "@/components/world/rooms/ProjectsRoom";
import { QUALITY } from "@/constants/quality";
import { LYING_HEIGHT, SPAWN } from "@/constants/world";
import { useGameStore, type Scene } from "@/store/useGameStore";
import PerfProbe from "./PerfProbe";
import ReadySignal from "./ReadySignal";
import Warmup from "./Warmup";

// background and fog colour for each place
const BACKGROUND: Record<Scene, string> = {
  lobby: "#241716",
  office: "#241716",
  projects: "#050810",
  certificates: "#1a0f14",
};

/**
 * Resizing a WebGL canvas clears it, and the next frame would show black until it is drawn again.
 * Redrawing right after any resize / resolution change (before the browser paints) hides that blank frame.
 */
function RenderOnResize() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  useLayoutEffect(() => {
    gl.render(scene, camera);
  }, [gl, scene, camera, size, dpr]);
  return null;
}

export default function Experience() {
  const scene = useGameStore((s) => s.scene);
  const quality = useGameStore((s) => s.quality);
  const q = QUALITY[quality];
  const inLobby = scene === "lobby";
  const bg = BACKGROUND[scene];

  // Antialiasing can only be chosen when the canvas is created. It is fixed for the session,
  // so the canvas is never rebuilt (a rebuild is a black flash and a full reload of the scene).
  const [antialias] = useState(
    () => QUALITY[useGameStore.getState().quality].antialias,
  );

  // Render resolution: starts at the top level and only ever steps DOWN, a few times, when it is safe.
  const configured = q.dpr as number | [number, number];
  const cfgMax = typeof configured === "number" ? configured : configured[1];
  const deviceDpr =
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const levels = useMemo(() => {
    const max = Math.max(1, Math.min(cfgMax, deviceDpr));
    return max <= 1 ? [1] : [max, 1 + (max - 1) / 2, 1];
  }, [cfgMax, deviceDpr]);
  const [level, setLevel] = useState(0);
  const dpr = levels[Math.min(level, levels.length - 1)];

  // "settled" = exploring for a while; never touch resolution or quality before that
  // (loading and waking up are the heaviest moments, and a resize there shows as a black flash)
  const since = useRef(0);
  const lastStep = useRef(0);
  useEffect(
    () =>
      useGameStore.subscribe((s, prev) => {
        if (
          (s.phase === "explore" && prev.phase !== "explore") ||
          s.scene !== prev.scene
        ) {
          since.current = performance.now();
        }
      }),
    [],
  );
  const settled = () => {
    const s = useGameStore.getState();
    return (
      s.sceneReady &&
      s.phase === "explore" &&
      performance.now() - since.current > 6000
    );
  };

  return (
    <Canvas
      dpr={dpr}
      camera={{
        fov: 68,
        near: 0.1,
        far: 100,
        position: [SPAWN.x, LYING_HEIGHT, SPAWN.z],
      }}
      gl={{ antialias, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, inLobby ? 34 : 70, inLobby ? 70 : 120]} />

      <Suspense fallback={null}>
        {scene === "lobby" && <Lobby />}
        {scene === "office" && <OfficeRoom />}
        {scene === "projects" && <ProjectsRoom />}
        {scene === "certificates" && <CertificatesRoom />}
        <ReadySignal />
        <Warmup key={scene} />
      </Suspense>

      <PlayerController />
      <InteractionRaycaster />
      <RenderOnResize />

      {/* when the frame rate dips for a while: lower the resolution one step (at most every 8 s);
          after repeated dips switch to Low. Neither happens before the visitor has been exploring for a bit. */}
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => {
          if (!settled()) return;
          if (performance.now() - lastStep.current < 8000) return;
          lastStep.current = performance.now();
          setLevel((l) => Math.min(l + 1, levels.length - 1));
        }}
        onFallback={() => {
          if (!settled()) return;
          const s = useGameStore.getState();
          if (s.quality === "high") s.setQuality("low");
        }}
      />

      {process.env.NODE_ENV === "development" && <PerfProbe />}
    </Canvas>
  );
}
