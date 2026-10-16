"use client";

import { useMemo, useState } from "react";
import { initials, logoSources } from "@/lib/logoTexture";

type Props = {
  logo?: string | null;
  name: string;
  badge?: string;
  color: string;
  size?: number;
};

/** Logo image for cards: tries the local file, then the CDN, then falls back to a lettered badge. */
export default function LogoBadge({
  logo,
  name,
  badge,
  color,
  size = 64,
}: Props) {
  const sources = useMemo(() => logoSources(logo), [logo]);
  const [failed, setFailed] = useState(0);

  if (failed >= sources.length) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-xl border-2 bg-white/90 text-sm font-extrabold text-[#14202a]"
        style={{ width: size, height: size, borderColor: color }}
      >
        {initials(name, badge)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[failed]}
      alt=""
      onError={() => setFailed((n) => n + 1)}
      className="shrink-0 rounded-xl bg-white/90 object-contain p-2"
      style={{ width: size, height: size }}
    />
  );
}
