import { neon } from "@neondatabase/serverless";

function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return neon(url);
}

let ready: Promise<void> | null = null;

/** Creates the table the first time it is needed. */
async function ensureTable() {
  if (!ready) {
    ready = (async () => {
      const sql = client();
      await sql`
        CREATE TABLE IF NOT EXISTS visitors (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          gender TEXT NOT NULL,
          is_company BOOLEAN NOT NULL DEFAULT FALSE,
          company TEXT,
          device TEXT,
          ip_hash TEXT,
          visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await sql`CREATE INDEX IF NOT EXISTS visitors_visited_at_idx ON visitors (visited_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS visitors_ip_hash_idx ON visitors (ip_hash, visited_at DESC)`;
    })().catch((e) => {
      ready = null; // try again on the next request
      throw e;
    });
  }
  return ready;
}

export interface NewVisitor {
  name: string;
  gender: string;
  isCompany: boolean;
  company: string | null;
  device: string | null;
  ipHash: string;
}

export async function insertVisitor(v: NewVisitor) {
  await ensureTable();
  const sql = client();
  await sql`
    INSERT INTO visitors (name, gender, is_company, company, device, ip_hash)
    VALUES (${v.name}, ${v.gender}, ${v.isCompany}, ${v.company}, ${v.device}, ${v.ipHash})`;
}

/** How many entries this (hashed) address has made recently: used to stop spam. */
export async function recentFromHash(
  ipHash: string,
  minutes = 10,
): Promise<number> {
  await ensureTable();
  const sql = client();
  const rows = await sql`
    SELECT COUNT(*)::int AS n FROM visitors
    WHERE ip_hash = ${ipHash} AND visited_at > NOW() - make_interval(mins => ${minutes})`;
  return (rows[0]?.n as number) ?? 0;
}

export interface VisitorRow {
  id: number;
  name: string;
  gender: string;
  is_company: boolean;
  company: string | null;
  device: string | null;
  visited_at: string | Date;
}

export async function listVisitors(limit = 200): Promise<VisitorRow[]> {
  await ensureTable();
  const sql = client();
  const rows = await sql`
    SELECT id, name, gender, is_company, company, device, visited_at
    FROM visitors ORDER BY visited_at DESC LIMIT ${limit}`;
  return rows as VisitorRow[];
}

export async function visitorStats() {
  await ensureTable();
  const sql = client();
  const rows = await sql`
    SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_company)::int AS companies FROM visitors`;
  return {
    total: (rows[0]?.total as number) ?? 0,
    companies: (rows[0]?.companies as number) ?? 0,
  };
}
