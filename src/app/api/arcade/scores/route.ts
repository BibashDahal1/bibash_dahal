import { NextResponse } from "next/server";
import type { ArcadeGameId } from "@/constants/arcade";
import { getPlayer, getTop, insertScore } from "@/lib/scoresDb";

const GAMES = new Set<string>(["snake", "breakout", "blocks", "flap", "merge"]);
const MODES = new Set(["easy", "normal", "hard", "insane"]);

/** Loose plausibility caps so obviously fake numbers are rejected. */
const plausible: Record<
  ArcadeGameId,
  (score: number, level: number) => boolean
> = {
  snake: (s, l) => s <= l * (4500 + 150 * l),
  breakout: (s) => s <= 400_000,
  blocks: (s) => s <= 3_000_000,
  flap: (s) => s <= 100_000,
  merge: (s) => s <= 2_000_000,
};

// tiny in-memory rate limit: 20 submissions per minute per IP
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

const cleanName = (v: unknown) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 24)
    : "";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const game = url.searchParams.get("game") ?? "";
    if (!GAMES.has(game))
      return NextResponse.json({ error: "invalid game" }, { status: 400 });
    const name = cleanName(url.searchParams.get("name"));
    const id = game as ArcadeGameId;
    const [top, me] = await Promise.all([
      getTop(id, 10),
      name ? getPlayer(id, name) : Promise.resolve({ best: 0, rank: 0 }),
    ]);
    return NextResponse.json({ top, best: me.best, rank: me.rank });
  } catch (e) {
    console.error("arcade scores GET", e);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (limited(ip))
      return NextResponse.json({ error: "slow down" }, { status: 429 });

    const body = (await req.json()) as Record<string, unknown>;
    const game = String(body.game);
    const name = cleanName(body.name);
    const score = Number(body.score);
    const level = Number(body.level);
    const mode = String(body.mode);

    if (
      !GAMES.has(game) ||
      !name ||
      !Number.isInteger(score) ||
      !Number.isInteger(level) ||
      !MODES.has(mode)
    ) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    const id = game as ArcadeGameId;
    if (score < 1 || level < 1 || level > 99 || !plausible[id](score, level)) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const before = await getPlayer(id, name);
    await insertScore(id, name, score, level, mode);
    const [top, after] = await Promise.all([
      getTop(id, 10),
      getPlayer(id, name),
    ]);

    return NextResponse.json({
      top,
      best: after.best,
      rank: after.rank,
      isNewBest: score > before.best,
      inTop10: after.rank > 0 && after.rank <= 10,
    });
  } catch (e) {
    console.error("arcade scores POST", e);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
