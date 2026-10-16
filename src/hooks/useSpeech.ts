import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";

const FEMALE = [
  "Google UK English Female",
  "Samantha",
  "Microsoft Zira",
  "Microsoft Aria",
  "Karen",
  "Moira",
  "Tessa",
];
const MALE = [
  "Google UK English Male",
  "Daniel",
  "Microsoft David",
  "Microsoft Guy",
  "Alex",
  "Fred",
];

type VoiceKind = "female" | "male";

function find(voices: SpeechSynthesisVoice[], prefs: string[]) {
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  for (const p of prefs) {
    const hit = en.find((v) => v.name.includes(p));
    if (hit) return hit;
  }
  return null;
}

/** Call from inside a click handler (the Enter button). iOS refuses speech until a gesture "unlocks" it. */
export function unlockSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance("");
  u.volume = useGameStore.getState().muted ? 0 : 1;
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

export function useSpeech() {
  const voices = useRef<{
    female: SpeechSynthesisVoice | null;
    male: SpeechSynthesisVoice | null;
    maleIsFallback: boolean;
  }>({ female: null, male: null, maleIsFallback: true });

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const update = () => {
      const all = synth.getVoices();
      const en = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
      const female = find(all, FEMALE) ?? en[0] ?? all[0] ?? null;
      const maleHit = find(all, MALE);
      voices.current = {
        female,
        male: maleHit ?? female,
        maleIsFallback: !maleHit,
      };
    };
    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
      synth.cancel();
    };
  }, []);

  /** Resolves when the line finishes, is cancelled, or speech isn't available. */
  const speak = useCallback(
    (
      text: string,
      opts?: { voice?: VoiceKind; rate?: number; pitch?: number },
    ) =>
      new Promise<void>((resolve) => {
        if (!("speechSynthesis" in window)) return resolve();
        const kind = opts?.voice ?? "female";
        const v = voices.current;
        const chosen = kind === "male" ? v.male : v.female;
        const u = new SpeechSynthesisUtterance(text);
        if (chosen) {
          u.voice = chosen;
          u.lang = chosen.lang;
        }
        // no real male voice installed? fake one by lowering the pitch
        const basePitch =
          kind === "male" ? (v.maleIsFallback ? 0.7 : 0.9) : 1.15;
        u.rate = opts?.rate ?? 0.95;
        u.pitch = opts?.pitch ?? basePitch;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      }),
    [],
  );

  const cancel = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { speak, cancel };
}
