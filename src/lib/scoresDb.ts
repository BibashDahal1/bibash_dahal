import { neon } from "@neondatabase/serverless";
import type { ArcadeGameId } from "@/constants/arcade";

export interface ScoreRow {
  name: string;
  score: number;
  level: number;
  mode: string;
}

const sql = () => neon(process.env.DATABASE_URL!);

let ready: Promise<void> | null = null;
function ensureTable() {
  ready ??= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS arcade_scores (
      id SERIAL PRIMARY KEY,
      game TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER NOT NULL,
      mode TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await q`CREATE INDEX IF NOT EXISTS arcade_scores_idx ON arcade_scores (game, score DESC)`;
    // one-time copy of the earlier snake-only table, if it exists
    try {
      await q`INSERT INTO arcade_scores (game, name, score, level, mode, created_at)
        SELECT 'snake', name, score, level, difficulty, created_at FROM snake_scores
        WHERE NOT EXISTS (SELECT 1 FROM arcade_scores WHERE game = 'snake')`;
    } catch {
      /* no old table: nothing to copy */
    }
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/** Top players for a game, one row per player (their best run). */
export async function getTop(
  game: ArcadeGameId,
  limit = 10,
): Promise<ScoreRow[]> {
  await ensureTable();
  const rows = await sql()`
    SELECT name, score, level, mode FROM (
      SELECT DISTINCT ON (lower(name)) name, score, level, mode, created_at
      FROM arcade_scores
      WHERE game = ${game}
      ORDER BY lower(name), score DESC, created_at ASC
    ) t
    ORDER BY score DESC, created_at ASC
    LIMIT ${limit}`;
  return (rows as Record<string, unknown>[]).map((r) => ({
    name: String(r.name),
    score: Number(r.score),
    level: Number(r.level),
    mode: String(r.mode),
  }));
}

/** A player's best score in a game and its rank among all players (1 = best). rank is 0 with no score. */
export async function getPlayer(
  game: ArcadeGameId,
  name: string,
): Promise<{ best: number; rank: number }> {
  await ensureTable();
  const q = sql();
  const b = (await q`
    SELECT COALESCE(MAX(score), 0)::int AS best FROM arcade_scores
    WHERE game = ${game} AND lower(name) = lower(${name})`) as Record<
    string,
    unknown
  >[];
  const best = Number(b[0]?.best ?? 0);
  if (best <= 0) return { best: 0, rank: 0 };
  const c = (await q`
    SELECT COUNT(*)::int AS c FROM (
      SELECT lower(name) AS n, MAX(score) AS m FROM arcade_scores WHERE game = ${game} GROUP BY lower(name)
    ) t WHERE m > ${best}`) as Record<string, unknown>[];
  return { best, rank: Number(c[0]?.c ?? 0) + 1 };
}

export async function insertScore(
  game: ArcadeGameId,
  name: string,
  score: number,
  level: number,
  mode: string,
) {
  await ensureTable();
  await sql()`INSERT INTO arcade_scores (game, name, score, level, mode) VALUES (${game}, ${name}, ${score}, ${level}, ${mode})`;
}
