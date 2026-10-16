import { AUDIO } from "@/constants/audio";
import type { Scene } from "@/store/useGameStore";

let ctx: AudioContext | null = null;
let master!: GainNode;
let musicBus!: GainNode;
let sfxBus!: GainNode;
let chatterBus!: GainNode;
let brownNoise: AudioBuffer | null = null; // soft, for footsteps
let whiteNoise: AudioBuffer | null = null; // breath, for voices
let started = false;
let wantMuted = false;
let wantScene: Scene = "lobby";

function makeBrown(c: AudioContext) {
  const buf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function makeWhite(c: AudioContext) {
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function applyLevels() {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(wantMuted ? 0 : 1, t, 0.1);
  chatterBus.gain.setTargetAtTime(
    wantScene === "lobby" ? AUDIO.chatter : 0,
    t,
    0.8,
  );
  musicBus.gain.setTargetAtTime(
    AUDIO.music * (wantScene === "lobby" ? 0.8 : 1),
    t,
    0.8,
  );
}

// ---------------------------------------------------------------------------
// Human chatter: a few distant "speakers". Each one is a voice-like source
// (buzzing pitch + a little breath) pushed through vowel formants, switched on
// and off in syllables, with pauses between phrases, like overheard talking.
// ---------------------------------------------------------------------------
const VOWELS: [number, number, number][] = [
  [730, 1090, 2440], // a
  [530, 1840, 2480], // e
  [270, 2290, 3010], // i
  [570, 840, 2410], // o
  [300, 870, 2240], // u
  [660, 1720, 2410], // ae
];

function createSpeaker(
  c: AudioContext,
  out: AudioNode,
  pan: number,
  f0: number,
  formantScale: number,
) {
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = f0;

  const vibrato = c.createOscillator();
  vibrato.frequency.value = 5 + Math.random() * 1.5;
  const vibratoDepth = c.createGain();
  vibratoDepth.gain.value = f0 * 0.02;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(osc.frequency);

  const breath = c.createBufferSource();
  breath.buffer = whiteNoise;
  breath.loop = true;
  const breathGain = c.createGain();
  breathGain.gain.value = 0.22;

  const source = c.createGain();
  osc.connect(source);
  breath.connect(breathGain);
  breathGain.connect(source);

  const env = c.createGain(); // syllable envelope
  env.gain.value = 0;

  const formants = [5, 7, 9].map((q, i) => {
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = [1, 0.6, 0.3][i];
    source.connect(bp);
    bp.connect(g);
    g.connect(env);
    return bp;
  });

  const soften = c.createBiquadFilter(); // makes it sound like it's across the room
  soften.type = "lowpass";
  soften.frequency.value = 2800;
  const level = c.createGain();
  level.gain.value = 0.11;
  env.connect(soften);
  soften.connect(level);

  if (c.createStereoPanner) {
    const panner = c.createStereoPanner();
    panner.pan.value = pan;
    level.connect(panner);
    panner.connect(out);
  } else {
    level.connect(out);
  }

  osc.start();
  vibrato.start();
  breath.start(0, Math.random());

  const speak = () => {
    if (!ctx) return;
    let t = c.currentTime + 0.05;
    const syllables = 4 + Math.floor(Math.random() * 7);
    const base = f0 * (0.9 + Math.random() * 0.25);

    for (let i = 0; i < syllables; i++) {
      const v = VOWELS[(Math.random() * VOWELS.length) | 0];
      const dur = 0.11 + Math.random() * 0.13;
      formants.forEach((bp, k) =>
        bp.frequency.setTargetAtTime(v[k] * formantScale, t, 0.025),
      );
      const pitch =
        base * (1 + (Math.random() - 0.5) * 0.25 - (i / syllables) * 0.08);
      osc.frequency.setTargetAtTime(pitch, t, 0.05);
      env.gain.setTargetAtTime(0.55 + Math.random() * 0.45, t, 0.02);
      env.gain.setTargetAtTime(0.0001, t + dur * 0.8, 0.03);
      t += dur + 0.03 + Math.random() * 0.07;
    }

    window.setTimeout(
      speak,
      (t - c.currentTime) * 1000 + 600 + Math.random() * 3200,
    );
  };
  window.setTimeout(speak, Math.random() * 3000);
}

function startChatter() {
  if (!ctx || !whiteNoise) return;
  const c = ctx;

  // a little room echo so it sounds like a big hall, not a headset
  const delay = c.createDelay();
  delay.delayTime.value = 0.11;
  const feedback = c.createGain();
  feedback.gain.value = 0.35;
  const damp = c.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 1800;
  const wet = c.createGain();
  wet.gain.value = 0.5;
  chatterBus.connect(delay);
  delay.connect(damp);
  damp.connect(feedback);
  feedback.connect(delay);
  damp.connect(wet);
  wet.connect(master);

  // [pan, pitch, formant scale]: men are lower with lower formants, women higher
  const speakers: [number, number, number][] = [
    [-0.8, 118, 1.0],
    [-0.45, 205, 1.15],
    [-0.1, 132, 0.98],
    [0.2, 224, 1.17],
    [0.5, 108, 0.95],
    [0.8, 196, 1.12],
    [0.0, 142, 1.02],
  ];
  for (const [pan, f0, scale] of speakers)
    createSpeaker(c, chatterBus, pan, f0, scale);
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------
const CHORDS = [
  [110, 220, 261.63, 329.63, 392],
  [87.31, 174.61, 220, 261.63, 329.63],
  [130.81, 261.63, 329.63, 392, 493.88],
  [98, 196, 246.94, 293.66, 392],
];

function startPad() {
  if (!ctx) return;
  let i = 0;
  const play = () => {
    if (!ctx) return;
    const now = ctx.currentTime;
    CHORDS[i++ % CHORDS.length].forEach((f, k) => {
      const o = ctx!.createOscillator();
      o.type = k % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = ctx!.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.05, now + 2.5);
      g.gain.linearRampToValueAtTime(0.0001, now + 9);
      const lp = ctx!.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      o.connect(lp);
      lp.connect(g);
      g.connect(musicBus);
      o.start(now);
      o.stop(now + 9.5);
    });
  };
  play();
  window.setInterval(play, 6500);
}

async function startMusic() {
  if (!ctx) return;
  try {
    const res = await fetch(AUDIO.musicUrl, { method: "HEAD" });
    if (res.ok && (res.headers.get("content-type") ?? "").startsWith("audio")) {
      const el = new Audio(AUDIO.musicUrl);
      el.loop = true;
      el.crossOrigin = "anonymous";
      ctx.createMediaElementSource(el).connect(musicBus);
      await el.play();
      return;
    }
  } catch {
    /* fall through to the generated pad */
  }
  startPad();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Call from inside a click (the Enter button): browsers only allow sound after a gesture. */
export function startAudio() {
  if (started) {
    ctx?.resume();
    return;
  }
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return;
  ctx = new Ctx() as AudioContext;
  started = true;

  master = ctx.createGain();
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  chatterBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  chatterBus.connect(master);

  brownNoise = makeBrown(ctx);
  whiteNoise = makeWhite(ctx);
  startChatter();
  startMusic();
  applyLevels();
  ctx.resume();
}

export function setAudioMuted(muted: boolean) {
  wantMuted = muted;
  applyLevels();
}

export function setAudioScene(scene: Scene) {
  wantScene = scene;
  applyLevels();
}

/** A soft thud plus a small heel click on a hard floor. */
export function footstep(run = false) {
  if (!ctx || !brownNoise || ctx.state !== "running") return;
  const t = ctx.currentTime;

  const thud = ctx.createBufferSource();
  thud.buffer = brownNoise;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 260 + Math.random() * 80;
  const g = ctx.createGain();
  const peak = (run ? 0.34 : 0.26) * (0.9 + Math.random() * 0.2);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  thud.connect(lp).connect(g).connect(sfxBus);
  thud.start(t, Math.random() * 1.5);
  thud.stop(t + 0.15);

  const click = ctx.createBufferSource();
  click.buffer = brownNoise;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1500 + Math.random() * 400;
  bp.Q.value = 1.2;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.0001, t);
  cg.gain.exponentialRampToValueAtTime(0.06, t + 0.003);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  click.connect(bp).connect(cg).connect(sfxBus);
  click.start(t, Math.random() * 1.5);
  click.stop(t + 0.06);
}

/** Reception bell. */
export function ding() {
  if (!ctx || ctx.state !== "running") return;
  const t = ctx.currentTime;
  for (const [f, v] of [
    [1320, 0.12],
    [1980, 0.06],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + 1.5);
  }
}
