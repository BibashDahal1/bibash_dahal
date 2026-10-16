"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

import PlayerController from "@/components/player/PlayerController";
import InteractionRaycaster from "@/components/world/interaction/InteractionRaycaster";
import Lobby from "@/components/world/lobby/Lobby";
import OfficeRoom from "@/components/world/rooms/OfficeRoom";
import ProjectsRoom from "@/components/world/rooms/ProjectsRoom";
import { QUALITY } from "@/constants/quality";
import { LYING_HEIGHT, SPAWN } from "@/constants/world";
import { useGameStore } from "@/store/useGameStore";
import ReadySignal from "./ReadySignal";

export default function Experience() {
  const scene = useGameStore((s) => s.scene);
  const quality = useGameStore((s) => s.quality);
  const q = QUALITY[quality];
  const inLobby = scene === "lobby";

  // warm dusk in the lobby and office, deep blue in the Projects room
  const bg = scene === "projects" ? "#050810" : "#241716";

  return (
    <Canvas
      key={quality} // antialiasing can't change on a live canvas, so a quality switch rebuilds it
      dpr={q.dpr}
      camera={{
        fov: 68,
        near: 0.1,
        far: 100,
        position: [SPAWN.x, LYING_HEIGHT, SPAWN.z],
      }}
      gl={{ antialias: q.antialias, powerPreference: "high-performance" }}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, inLobby ? 34 : 70, inLobby ? 70 : 120]} />

      <Suspense fallback={null}>
        {scene === "lobby" && <Lobby />}
        {scene === "office" && <OfficeRoom />}
        {scene === "projects" && <ProjectsRoom />}
        <ReadySignal />
      </Suspense>

      <PlayerController />
      <InteractionRaycaster />

      {/* if the frame rate really struggles after the experience has started, drop to Low automatically */}
      <PerformanceMonitor
        onDecline={() => {
          const s = useGameStore.getState();
          if (s.sceneReady && s.phase !== "intro" && s.quality === "high")
            s.setQuality("low");
        }}
      />
    </Canvas>
  );
}
