"use client";

import { useCallback, useEffect } from "react";
import { relockIfWanted } from "@/lib/mouseLook";
import { useGameStore } from "@/store/useGameStore";
import CertificateViewer from "./CertificateViewer";
import MediaViewer from "./MediaViewer";
import PdfViewer from "./PdfViewer";
import ProjectDetail from "./ProjectDetail";
import SkillDetail from "./SkillDetail";
import SnakeArcade from "./SnakeArcade";

/** Skill / project card, the media or certificate viewer, the CV viewer, or the snake arcade. Pauses the world while open. */
export default function DetailOverlay() {
  const detail = useGameStore((s) => s.detail);

  const close = useCallback(() => {
    useGameStore.getState().closeDetail();
    relockIfWanted(); // only re-captures the mouse if mouse look was on
  }, []);

  useEffect(() => {
    if (!detail) return;
    document.exitPointerLock?.(); // the mouse is needed for the buttons
    if (detail.kind === "arcade") return; // the arcade handles its own keys (Esc pauses the game)
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, close]);

  if (!detail) return null;
  if (detail.kind === "arcade") return <SnakeArcade onClose={close} />;
  if (detail.kind === "doc")
    return <PdfViewer file={detail.file} onClose={close} />;
  if (detail.kind === "media") {
    return (
      <MediaViewer
        project={detail.project}
        startIndex={detail.index}
        onClose={close}
      />
    );
  }
  if (detail.kind === "certificate")
    return <CertificateViewer startIndex={detail.index} onClose={close} />;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#d4af37]/30 bg-[#0f0d0b]/95 p-5 shadow-2xl sm:p-7"
      >
        {detail.kind === "skill" ? (
          <SkillDetail skill={detail.skill} />
        ) : (
          <ProjectDetail project={detail.project} />
        )}
        <button
          type="button"
          onClick={close}
          className="mt-7 w-full rounded-lg border border-white/20 py-2.5 text-xs uppercase tracking-widest text-[#e8dfc9] transition hover:border-[#d4af37]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
