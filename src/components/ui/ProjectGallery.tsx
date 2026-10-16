"use client";

import type { Project } from "@/data/types";
import { mediaThumb } from "@/lib/cloudinary";
import { useGameStore } from "@/store/useGameStore";

/** Thumbnails of a project's videos and images. Clicking one opens the full viewer. */
export default function ProjectGallery({ project }: { project: Project }) {
  const media = project.media ?? [];
  if (media.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="text-xs uppercase tracking-widest text-[#8a7f66]">
        Gallery
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {media.map((m, i) => (
          <button
            key={`${m.src}-${i}`}
            type="button"
            onClick={() =>
              useGameStore
                .getState()
                .openDetail({ kind: "media", project, index: i })
            }
            className="relative aspect-video overflow-hidden rounded-lg border border-white/15 bg-black/40 transition hover:border-[#d4af37]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaThumb(m, 400)}
              alt={m.caption ?? project.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {m.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-xs text-white">
                  ▶
                </span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
