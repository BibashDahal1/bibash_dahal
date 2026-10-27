"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useIsTouch } from "@/hooks/useIsTouch";
import { useGameStore } from "@/store/useGameStore";
import AudioController from "@/components/ui/AudioController";
import ControlPad from "@/components/ui/ControlPad";
import DesktopMouseLook from "@/components/ui/DesktopMouseLook";
import DetailOverlay from "@/components/ui/DetailOverlay";
import FadeOverlay from "@/components/ui/FadeOverlay";
import Hud from "@/components/ui/Hud";
import InteractPrompt from "@/components/ui/InteractPrompt";
import IntroScreen from "@/components/ui/IntroScreen";
import LoadingScreen from "@/components/ui/LoadingScreen";
import MenuOverlay from "@/components/ui/MenuOverlay";
import RoomHud from "@/components/ui/RoomHud";
import SettingsBar from "@/components/ui/SettingsBar";
import WakeOverlay from "@/components/ui/WakeOverlay";

const Experience = dynamic(() => import("@/components/canvas/Experience"), {
  ssr: false,
});

export default function GameShell() {
  const phase = useGameStore((s) => s.phase);
  const isTouch = useIsTouch();
  const canMove = phase === "explore" || phase === "guided";

  // The 3D scene only mounts once the quality is decided, so it is built ONCE with the right settings
  // (antialiasing, crystal count, lights...). Before, it was built at High and then rebuilt for Low on weak devices.
  const [qualityReady, setQualityReady] = useState(false);

  // phones and low-core machines start on Low; the visitor can switch with G / the button
  useEffect(() => {
    const weak =
      window.matchMedia("(pointer: coarse)").matches ||
      (navigator.hardwareConcurrency ?? 8) <= 4;
    useGameStore.getState().setQuality(weak ? "low" : "high");
    setQualityReady(true);
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      {qualityReady && <Experience />}
      <AudioController />
      <WakeOverlay />
      <Hud />
      {/* touch devices: on-screen controller. desktop: mouse look + keyboard */}
      {canMove && isTouch && <ControlPad />}
      {canMove && !isTouch && <DesktopMouseLook />}
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
