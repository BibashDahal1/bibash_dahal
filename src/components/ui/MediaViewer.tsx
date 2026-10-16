"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/data/types";
import { imageUrl, videoSources } from "@/lib/cloudinary";

type Props = { project: Project; startIndex: number; onClose: () => void };

/** Full-screen viewer for a project's images and videos, with previous / next. Videos have sound and controls. */
export default function MediaViewer({ project, startIndex, onClose }: Props) {
  const media = project.media ?? [];
  const [index, setIndex] = useState(
    Math.min(startIndex, Math.max(0, media.length - 1)),
  );
  const current = media[index];

  const step = (d: number) =>
    setIndex((i) => (i + d + media.length) % media.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") step(1);
      if (e.code === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.length]);

  if (!current) return null;
  const sources =
    current.type === "video" ? videoSources(current.src, 1280) : null;
  const posterSrc = current.poster
    ? imageUrl(current.poster, 1280)
    : sources?.poster;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="mr-auto min-w-0">
          <p className="truncate font-display text-sm text-[#f4ede0] sm:text-base">
            {project.name}
          </p>
          <p className="truncate text-xs text-[#9fb4c8]">
            {current.caption ?? (current.type === "video" ? "Video" : "Image")}{" "}
            · {index + 1} / {media.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[#d4af37] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-[#ffe08a]"
        >
          Close
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-2 sm:p-6">
        {current.type === "video" && sources ? (
          <video
            key={sources.video}
            src={sources.video}
            poster={posterSrc}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-md bg-black shadow-2xl"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.src}
            src={imageUrl(current.src, 1920)}
            alt={current.caption ?? project.name}
            className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
          />
        )}

        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-lg text-white transition hover:border-[#d4af37] sm:left-6"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-lg text-white transition hover:border-[#d4af37] sm:right-6"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
