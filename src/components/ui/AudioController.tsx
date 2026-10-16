"use client";

import { useEffect } from "react";
import { setAudioMuted, setAudioScene } from "@/lib/audio";
import { useGameStore } from "@/store/useGameStore";

/** Keeps the audio engine in step with the mute switch and the current room. Renders nothing. */
export default function AudioController() {
  const scene = useGameStore((s) => s.scene);
  const muted = useGameStore((s) => s.muted);

  useEffect(() => setAudioScene(scene), [scene]);
  useEffect(() => {
    setAudioMuted(muted);
    if (muted && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [muted]);

  return null;
}
