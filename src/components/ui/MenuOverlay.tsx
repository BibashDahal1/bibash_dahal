"use client";

import { useEffect } from "react";
import { relockIfWanted } from "@/lib/mouseLook";
import { useGameStore } from "@/store/useGameStore";

type OptionId = "meet" | "projects" | "look" | "stroll";

const OPTIONS: { id: OptionId; title: string; hint: string }[] = [
  {
    id: "meet",
    title: "Meet Bibash Dahal",
    hint: "Someone will take you to the office",
  },
  {
    id: "projects",
    title: "See his projects",
    hint: "Visit the project gallery",
  },
  { id: "look", title: "Look around the lobby", hint: "Take your time" },
  { id: "stroll", title: "Just stroll", hint: "No agenda, just wandering" },
];

export default function MenuOverlay() {
  const phase = useGameStore((s) => s.phase);
  const name = useGameStore((s) => s.name);

  // the mouse is needed for the buttons
  useEffect(() => {
    if (phase === "menu") document.exitPointerLock?.();
  }, [phase]);

  if (phase !== "menu") return null;

  const choose = (id: OptionId) => {
    relockIfWanted(); // a click is a user gesture; only re-captures the mouse if mouse look was on
    const s = useGameStore.getState();

    if (id === "meet" || id === "projects") {
      s.setDestination(id === "meet" ? "office" : "projects");
      s.setPhase("guided");
    } else {
      s.setReply(
        id === "look"
          ? `Of course, ${name}. Take your time. The lounges and the art on the walls are worth a look, and I'm right here if you need anything.`
          : `Enjoy your stroll, ${name}. The Office is the door on your left and Projects is on your right, whenever you're ready.`,
      );
      s.setPhase("explore");
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-xl rounded-2xl border border-[#d4af37]/30 bg-[#0f0d0b]/90 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
        <p className="font-display text-sm text-[#f4ede0] sm:text-base">
          How may I help you, {name}?
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => choose(o.id)}
              className="rounded-lg border border-white/15 px-4 py-3 text-left transition hover:border-[#d4af37] hover:bg-[#d4af37]/10 active:scale-[0.98]"
            >
              <span className="block text-sm font-semibold text-[#ffe08a]">
                {o.title}
              </span>
              <span className="block text-xs text-[#c9bfa6]">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
