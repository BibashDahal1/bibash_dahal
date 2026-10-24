import { useGameStore } from "@/store/useGameStore";

let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** A tiny retro blip. Respects the mute button. */
export function blip(
  freq: number,
  dur = 0.08,
  type: OscillatorType = "square",
  vol = 0.05,
  slideTo?: number,
) {
  if (useGameStore.getState().muted) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Rising arpeggio for a level-up. */
export function fanfare() {
  [523, 659, 784, 1047].forEach((f, i) =>
    setTimeout(() => blip(f, 0.12, "square", 0.05), i * 90),
  );
}
