import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { insertVisitor, recentFromHash } from "@/lib/db";

const GENDERS = ["male", "female", "other"];
const MAX_PER_WINDOW = 5; // entries per address per 10 minutes

/** Trims, collapses spaces and caps the length. Anything that isn't text becomes "". */
const clean = (value: unknown, max: number) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  const name = clean(body.name, 60);
  const gender = typeof body.gender === "string" ? body.gender : "";
  const isCompany = body.isCompany === true;
  const company = isCompany ? clean(body.company, 100) : "";
  const device = body.device === "mobile" ? "mobile" : "desktop";

  if (name.length < 2)
    return NextResponse.json(
      { ok: false, error: "Name is required" },
      { status: 400 },
    );
  if (!GENDERS.includes(gender))
    return NextResponse.json(
      { ok: false, error: "Invalid choice" },
      { status: 400 },
    );
  if (isCompany && company.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Company name is required" },
      { status: 400 },
    );
  }

  // the address is stored only as a salted hash, and only to limit spam
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "unknown";
  const ipHash = createHash("sha256")
    .update(ip + (process.env.VISITOR_SALT ?? ""))
    .digest("hex")
    .slice(0, 32);

  try {
    if ((await recentFromHash(ipHash)) >= MAX_PER_WINDOW) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429 },
      );
    }
    await insertVisitor({
      name,
      gender,
      isCompany,
      company: isCompany ? company : null,
      device,
      ipHash,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[visitors] could not save:", e);
    return NextResponse.json(
      { ok: false, error: "Could not save" },
      { status: 500 },
    );
  }
}
