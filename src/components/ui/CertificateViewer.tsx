"use client";

import { useEffect, useMemo, useState } from "react";
import { CERTIFICATES } from "@/data/certificates";
import { getCertificateCardCanvas } from "@/lib/classicTextures";
import { imageUrl } from "@/lib/cloudinary";

type Props = { startIndex: number; onClose: () => void };

/** Full-screen viewer for a certificate: the picture large, its details, a verify link, previous / next. */
export default function CertificateViewer({ startIndex, onClose }: Props) {
  const [index, setIndex] = useState(
    Math.min(startIndex, Math.max(0, CERTIFICATES.length - 1)),
  );
  const cert = CERTIFICATES[index];

  const step = (d: number) =>
    setIndex((i) => (i + d + CERTIFICATES.length) % CERTIFICATES.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "ArrowRight") step(1);
      if (e.code === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the scan if there is one, otherwise the generated card
  const src = useMemo(
    () =>
      cert?.image
        ? imageUrl(cert.image, 1920)
        : cert
          ? getCertificateCardCanvas(cert).toDataURL("image/jpeg", 0.92)
          : "",
    [cert],
  );

  if (!cert) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="mr-auto min-w-0">
          <p className="truncate font-display text-sm text-[#f4ede0] sm:text-base">
            {cert.title}
          </p>
          <p className="truncate text-xs text-[#c9bfa6]">
            {cert.issuer} · {cert.date} · {index + 1} / {CERTIFICATES.length}
          </p>
        </div>
        {cert.credentialUrl && (
          <a
            href={cert.credentialUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-[#d4af37]/60 px-3 py-1.5 text-xs text-[#ffe08a] transition hover:bg-[#d4af37]/15"
          >
            Verify credential ↗
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-[#d4af37] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-black transition hover:bg-[#ffe08a]"
        >
          Close
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center p-2 sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt={cert.title}
          className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
        />

        {CERTIFICATES.length > 1 && (
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

      {cert.description && (
        <p className="border-t border-white/10 px-4 py-3 text-center text-sm text-[#d9d0bd]">
          {cert.description}
        </p>
      )}
    </div>
  );
}
