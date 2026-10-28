"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import Person from "@/components/characters/Person";
import { RECEPTIONIST_LOOK } from "@/components/characters/looks";
import OfficeChair from "@/components/world/props/OfficeChair";
import {
  ARRIVAL_RADIUS,
  DESK,
  RECEPTIONIST_HIPS_Z,
  RECEPTIONIST_SEAT_HEIGHT,
} from "@/constants/world";
import { useSpeech } from "@/hooks/useSpeech";
import { ding } from "@/lib/audio";
import { playerPos } from "@/lib/player";
import { sleep } from "@/lib/sleep";
import { armSpeechWarmup } from "@/lib/speechWarmup";
import { useGameStore } from "@/store/useGameStore";
import SpeechBubble from "./SpeechBubble";

const lineTime = (text: string) => Math.max(1800, text.length * 55);

/** resolves when the browser is idle (or after 400 ms at the latest), so heavy work never lands on a busy frame */
const idle = () =>
  new Promise<void>((resolve) => {
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
    };
    if (w.requestIdleCallback)
      w.requestIdleCallback(() => resolve(), { timeout: 400 });
    else setTimeout(resolve, 0);
  });

export default function Receptionist() {
  const name = useGameStore((s) => s.name);
  const pose = useGameStore((s) => s.receptionistPose);
  const line = useGameStore((s) => s.lines.receptionist);
  const reply = useGameStore((s) => s.reply);

  // Narrow subscriptions: this component only re-renders when one of these yes/no values really flips.
  // Subscribing to the whole `phase` re-rendered the receptionist (and her chair and body) at every phase change,
  // including the moment the visitor finishes waking up.
  const calling = useGameStore(
    (s) =>
      s.phase === "waking" || (s.phase === "explore" && s.greetCount === 0),
  );
  const greeting = useGameStore((s) => s.phase === "greeting");

  const { speak, cancel } = useSpeech();

  // After the visitor says "just looking", the desk stays quiet until they walk away and come back.
  const armed = useRef(true);

  // 0) Warm the speech engine up silently on the first click / key press (the intro form), long before it is needed
  useEffect(() => armSpeechWarmup(), []);

  // 1) Call the visitor by name until they arrive (only before the very first greeting)
  useEffect(() => {
    if (!calling || !name) return;
    const { setLine } = useGameStore.getState();
    let stop = false;
    const lines = [
      `${name}!`,
      `${name}, over here please!`,
      `${name}, can you hear me? Please come to the reception desk.`,
    ];

    (async () => {
      await sleep(1200);
      await idle(); // the first spoken line starts the browser's voice engine: do it on a quiet frame
      let i = 0;
      while (!stop) {
        const text = lines[i++ % lines.length];
        setLine("receptionist", text);
        await Promise.all([speak(text), sleep(1800)]);
        if (stop) break;
        setLine("receptionist", null);
        await sleep(1400);
      }
    })();

    return () => {
      stop = true;
      cancel();
      setLine("receptionist", null);
    };
  }, [calling, name, speak, cancel]);

  // 2) Greeting, then hand over to the menu
  useEffect(() => {
    if (!greeting) return;
    const { setLine, setPhase, greetCount } = useGameStore.getState();
    const text =
      greetCount <= 1
        ? `Welcome, ${name}. What brings you to the office today?`
        : `Welcome back, ${name}. Is there anything else I can help you with?`;
    let cancelled = false;

    ding();
    const id = setTimeout(async () => {
      setLine("receptionist", text);
      await Promise.all([speak(text), sleep(lineTime(text))]);
      if (cancelled) return;
      setLine("receptionist", null);
      setPhase("menu");
    }, 350); // Chrome can drop speech issued right after cancel()

    return () => {
      cancelled = true;
      clearTimeout(id);
      cancel();
      setLine("receptionist", null);
    };
  }, [greeting, name, speak, cancel]);

  // 3) Answer for the "look around" menu choice
  useEffect(() => {
    if (!reply) return;
    armed.current = false;
    const { setLine, setReply } = useGameStore.getState();
    let cancelled = false;

    (async () => {
      setLine("receptionist", reply);
      await Promise.all([speak(reply), sleep(lineTime(reply))]);
      if (cancelled) return;
      setLine("receptionist", null);
      setReply(null);
    })();

    return () => {
      cancelled = true;
      cancel();
      setLine("receptionist", null);
    };
  }, [reply, speak, cancel]);

  // 4) Arrival detection (re-arms once the visitor walks away from the desk)
  useFrame(() => {
    const st = useGameStore.getState();
    if (st.phase !== "explore") return;
    const dz = playerPos.z - DESK.z;
    const dist = Math.hypot(playerPos.x, dz);
    if (!armed.current) {
      if (dist > ARRIVAL_RADIUS + 1.5) armed.current = true;
      return;
    }
    if (dz > 0 && dist < ARRIVAL_RADIUS) st.arrive();
  });

  return (
    <group>
      <OfficeChair
        position={[0, 0, RECEPTIONIST_HIPS_Z - 0.05]}
        seatHeight={RECEPTIONIST_SEAT_HEIGHT - 0.03}
      />
      <Person
        look={RECEPTIONIST_LOOK}
        modelIndex={0}
        pose={pose}
        seatHeight={RECEPTIONIST_SEAT_HEIGHT}
        speaking={line !== null}
        lookAtCamera
        position={[0, 0, RECEPTIONIST_HIPS_Z]}
      />
      <SpeechBubble text={line} position={[0, 2.15, RECEPTIONIST_HIPS_Z]} />
    </group>
  );
}
