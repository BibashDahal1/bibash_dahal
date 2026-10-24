import { neon } from "@neondatabase/serverless";

export interface ScoreRow {
  name: string;
  score: number;
  level: number;
  difficulty: string;
}

const sql = () => neon(process.env.DATABASE_URL!);

let ready: Promise<void> | null = null;
function ensureTable() {
  ready ??= (async () => {
    const q = sql();
    await q`CREATE TABLE IF NOT EXISTS snake_scores (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
    await q`CREATE INDEX IF NOT EXISTS snake_scores_score_idx ON snake_scores (score DESC)`;
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/** Top 10 players, one row per player (their best run). */
export async function getTop(limit = 10): Promise<ScoreRow[]> {
  await ensureTable();
  const rows = await sql()`
    SELECT name, score, level, difficulty FROM (
      SELECT DISTINCT ON (lower(name)) name, score, level, difficulty, created_at
      FROM snake_scores
      ORDER BY lower(name), score DESC, created_at ASC
    ) t
    ORDER BY score DESC, created_at ASC
    LIMIT ${limit}`;
  return (rows as Record<string, unknown>[]).map((r) => ({
    name: String(r.name),
    score: Number(r.score),
    level: Number(r.level),
    difficulty: String(r.difficulty),
  }));
}

/** A player's best score and where it ranks among all players (1 = best). rank is 0 when they have no score. */
export async function getPlayer(
  name: string,
): Promise<{ best: number; rank: number }> {
  await ensureTable();
  const q = sql();
  const b = (await q`
    SELECT COALESCE(MAX(score), 0)::int AS best FROM snake_scores WHERE lower(name) = lower(${name})`) as Record<
    string,
    unknown
  >[];
  const best = Number(b[0]?.best ?? 0);
  if (best <= 0) return { best: 0, rank: 0 };
  const c = (await q`
    SELECT COUNT(*)::int AS c FROM (
      SELECT lower(name) AS n, MAX(score) AS m FROM snake_scores GROUP BY lower(name)
    ) t WHERE m > ${best}`) as Record<string, unknown>[];
  return { best, rank: Number(c[0]?.c ?? 0) + 1 };
}

export async function insertScore(
  name: string,
  score: number,
  level: number,
  difficulty: string,
) {
  await ensureTable();
  await sql()`INSERT INTO snake_scores (name, score, level, difficulty) VALUES (${name}, ${score}, ${level}, ${difficulty})`;
}
