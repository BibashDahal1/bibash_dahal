/** "react" -> local file first, then the Devicon CDN. A path or URL is used as-is. null -> no sources (badge). */
export function logoSources(logo: string | null | undefined): string[] {
  if (!logo) return [];
  if (logo.startsWith("/") || /^https?:\/\//i.test(logo)) return [logo];
  return [
    `/logos/${logo}.svg`,
    `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${logo}/${logo}-original.svg`,
  ];
}

export function initials(name: string, badge?: string) {
  if (badge) return badge;
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return (words.length > 1 ? words.map((w) => w[0]).join("") : name.slice(0, 2))
    .slice(0, 3)
    .toUpperCase();
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  let src = url;
  let blobUrl: string | null = null;

  // Some SVGs have no width/height, which breaks drawImage in Firefox — add them.
  if (/\.svg(\?|$)/i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let text = await res.text();
    if (!/<svg[^>]*\swidth=/i.test(text))
      text = text.replace(/<svg/i, '<svg width="512" height="512"');
    blobUrl = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
    src = blobUrl;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      resolve(img);
    };
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const cache = new Map<string, Promise<HTMLCanvasElement>>();

/** One square "hologram tile": a light glowing panel with the logo (or a lettered badge) on it. Cached. */
export function renderLogoCanvas(
  logo: string | null | undefined,
  badge: string,
  accent: string,
) {
  const key = `${logo}|${badge}|${accent}`;
  let job = cache.get(key);
  if (!job) {
    job = build(logo, badge, accent);
    cache.set(key, job);
  }
  return job;
}

async function build(
  logo: string | null | undefined,
  badge: string,
  accent: string,
) {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  roundedRect(ctx, 28, 28, S - 56, S - 56, 70);
  ctx.fillStyle = "rgba(236,248,255,0.93)";
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = accent;
  ctx.stroke();

  let drawn = false;
  for (const src of logoSources(logo)) {
    try {
      const img = await loadImage(src);
      const box = S - 220;
      const k = Math.min(box / img.width, box / img.height);
      const w = img.width * k;
      const h = img.height * k;
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      drawn = true;
      break;
    } catch {
      /* try the next source */
    }
  }

  if (!drawn) {
    ctx.fillStyle = "#14202a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${badge.length > 3 ? 120 : badge.length > 2 ? 150 : 190}px system-ui, sans-serif`;
    ctx.fillText(badge, S / 2, S / 2 + 8);
  }
  return canvas;
}
