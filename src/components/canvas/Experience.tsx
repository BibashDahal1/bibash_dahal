"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
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
import ReadySignal from "./ReadySignal";

// background and fog colour for each place
const BACKGROUND: Record<Scene, string> = {
  lobby: "#241716",
  office: "#241716",
  projects: "#050810",
  certificates: "#1a0f14",
};

export default function Experience() {
  const scene = useGameStore((s) => s.scene);
  const quality = useGameStore((s) => s.quality);
  const q = QUALITY[quality];
  const inLobby = scene === "lobby";
  const bg = BACKGROUND[scene];

  return (
    <Canvas
      dpr={[1, 1.5]}
      key={quality} // antialiasing can't change on a live canvas, so a quality switch rebuilds it
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
        {scene === "certificates" && <CertificatesRoom />}
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
