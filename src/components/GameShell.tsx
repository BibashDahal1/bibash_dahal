"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useIsTouch } from "@/hooks/useIsTouch";
import { useGameStore } from "@/store/useGameStore";
import AudioController from "@/components/ui/AudioController";
import DetailOverlay from "@/components/ui/DetailOverlay";
import FadeOverlay from "@/components/ui/FadeOverlay";
import Hud from "@/components/ui/Hud";
import InteractPrompt from "@/components/ui/InteractPrompt";
import IntroScreen from "@/components/ui/IntroScreen";
import LoadingScreen from "@/components/ui/LoadingScreen";
import MenuOverlay from "@/components/ui/MenuOverlay";
import RoomHud from "@/components/ui/RoomHud";
import SettingsBar from "@/components/ui/SettingsBar";
import TouchControls from "@/components/ui/TouchControls";
import WakeOverlay from "@/components/ui/WakeOverlay";

const Experience = dynamic(() => import("@/components/canvas/Experience"), {
  ssr: false,
});

export default function GameShell() {
  const phase = useGameStore((s) => s.phase);
  const isTouch = useIsTouch();
  const canMove = phase === "explore" || phase === "guided";

  // phones and low-core machines start on Low; the visitor can switch with G / the button
  useEffect(() => {
    const weak =
      window.matchMedia("(pointer: coarse)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    useGameStore.getState().setQuality(weak ? "low" : "high");
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <Experience />
      <AudioController />
      <WakeOverlay />
      <Hud />
      {canMove && isTouch && <TouchControls />}
      <InteractPrompt />
      <RoomHud />
      <SettingsBar />
      <MenuOverlay />
      <DetailOverlay />
      <FadeOverlay />
      <IntroScreen />
      <LoadingScreen />
    </main>
  );
}
