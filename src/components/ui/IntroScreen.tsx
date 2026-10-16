"use client";

import { FormEvent, useState } from "react";
import { Gender, useGameStore } from "@/store/useGameStore";
import { unlockSpeech } from "@/hooks/useSpeech";
import { startAudio } from "@/lib/audio";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];

export default function IntroScreen() {
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);

  if (phase !== "intro") return null;

  const valid = name.trim().length >= 2 && gender !== null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid && gender) {
      unlockSpeech();
      startAudio();
      startGame(name, gender);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-[#d4af37]/30 bg-[#0f0d0b]/90 p-6 shadow-2xl sm:p-8"
      >
        <p className="font-display text-xs uppercase tracking-[0.35em] text-[#d4af37]">
          Welcome
        </p>
        <h1 className="font-display mt-2 text-2xl text-[#f4ede0] sm:text-3xl">
          Before you step inside
        </h1>

        <label
          className="mt-6 block text-sm text-[#c9bfa6]"
          htmlFor="visitor-name"
        >
          Your name
        </label>
        <input
          id="visitor-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="given-name"
          placeholder="e.g. Aarav"
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-[#f4ede0] outline-none transition focus:border-[#d4af37]"
        />

        <fieldset className="mt-5">
          <legend className="text-sm text-[#c9bfa6]">Your character</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                aria-pressed={gender === g.value}
                className={`rounded-lg border px-2 py-3 text-xs transition sm:text-sm ${
                  gender === g.value
                    ? "border-[#d4af37] bg-[#d4af37]/15 text-[#ffe08a]"
                    : "border-white/15 text-[#c9bfa6] hover:border-white/40"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={!valid}
          className="mt-7 w-full rounded-lg bg-[#d4af37] py-3 text-sm font-semibold uppercase tracking-widest text-black transition enabled:hover:bg-[#ffe08a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
