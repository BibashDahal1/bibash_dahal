"use client";

import { FormEvent, useState } from "react";
import { unlockSpeech } from "@/hooks/useSpeech";
import { startAudio } from "@/lib/audio";
import { saveVisitor } from "@/lib/visitors";
import { Gender, useGameStore } from "@/store/useGameStore";

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
  const [isCompany, setIsCompany] = useState(false);
  const [company, setCompany] = useState("");

  if (phase !== "intro") return null;

  const valid =
    name.trim().length >= 2 &&
    gender !== null &&
    (!isCompany || company.trim().length >= 2);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !gender) return;

    // saved in the background: the visitor never waits for it
    saveVisitor({
      name: name.trim(),
      gender,
      isCompany,
      company: isCompany ? company.trim() : undefined,
      device: window.matchMedia("(pointer: coarse)").matches
        ? "mobile"
        : "desktop",
    });

    unlockSpeech();
    startAudio();
    startGame(name, gender);
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#d4af37]/30 bg-[#0f0d0b]/90 p-6 shadow-2xl sm:p-8"
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
          maxLength={60}
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

        {/* company: ticking the box reveals the company name */}
        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-[#c9bfa6]">
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
            className="h-4 w-4 accent-[#d4af37]"
          />
          I&apos;m visiting on behalf of a company
        </label>

        {isCompany && (
          <div className="mt-3">
            <label
              className="block text-sm text-[#c9bfa6]"
              htmlFor="visitor-company"
            >
              Company name
            </label>
            <input
              id="visitor-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              maxLength={100}
              autoFocus
              autoComplete="organization"
              placeholder="e.g. Acme Technologies"
              className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-[#f4ede0] outline-none transition focus:border-[#d4af37]"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!valid}
          className="mt-7 w-full rounded-lg bg-[#d4af37] py-3 text-sm font-semibold uppercase tracking-widest text-black transition enabled:hover:bg-[#ffe08a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enter
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#8a7f66]">
          Your name{isCompany ? " and company" : ""} are saved so I know who
          visited.
        </p>
      </form>
    </div>
  );
}
