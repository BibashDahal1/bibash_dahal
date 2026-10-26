import { NextResponse } from "next/server";
import { getPlayer, getTop, insertScore } from "@/lib/scoresDb";

const GAME = "snake" as const;
const DIFFS = new Set(["easy", "normal", "hard", "insane"]);

// very small in-memory rate limit: 20 submissions per minute per IP
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
    const name = cleanName(new URL(req.url).searchParams.get("name"));
    const [top, me] = await Promise.all([
      getTop(GAME, 10),
      name ? getPlayer(GAME, name) : Promise.resolve({ best: 0, rank: 0 }),
    ]);
    return NextResponse.json({ top, best: me.best, rank: me.rank });
  } catch (e) {
    console.error("snake scores GET", e);
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
    const name = cleanName(body.name);
    const score = Number(body.score);
    const level = Number(body.level);
    const difficulty = String(body.difficulty);

    if (
      !name ||
      !Number.isInteger(score) ||
      !Number.isInteger(level) ||
      !DIFFS.has(difficulty)
    ) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }
    // loose plausibility cap so obviously fake numbers are rejected
    if (
      score < 1 ||
      level < 1 ||
      level > 99 ||
      score > level * (4500 + 150 * level)
    ) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const before = await getPlayer(GAME, name);
    await insertScore(GAME, name, score, level, difficulty);
    const [top, after] = await Promise.all([
      getTop(GAME, 10),
      getPlayer(GAME, name),
    ]);

    return NextResponse.json({
      top,
      best: after.best,
      rank: after.rank,
      isNewBest: score > before.best,
      inTop10: after.rank > 0 && after.rank <= 10,
    });
  } catch (e) {
    console.error("snake scores POST", e);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
