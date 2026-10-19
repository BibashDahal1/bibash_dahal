import { Suspense } from "react";
import { notFound } from "next/navigation";
import { listVisitors, visitorStats } from "@/lib/db";

export const metadata = {
  title: "Visitors",
  robots: { index: false, follow: false },
};

const fmt = (d: string | Date) =>
  new Date(d).toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  });

type Search = Promise<{ key?: string }>;

/** The part that reads the key and the database: it must sit inside <Suspense>. */
async function VisitorsTable({ searchParams }: { searchParams: Search }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) notFound();

  const [rows, stats] = await Promise.all([listVisitors(200), visitorStats()]);

  return (
    <>
      <p className="mt-2 text-sm text-[#c9bfa6]">
        {stats.total} total · {stats.companies} from companies · showing the
        latest {rows.length}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-[#8a7f66]">
            <tr>
              <th className="px-4 py-3">When (Nepal time)</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Character</th>
              <th className="px-4 py-3">Device</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="whitespace-nowrap px-4 py-3 text-[#c9bfa6]">
                  {fmt(r.visited_at)}
                </td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">
                  {r.is_company ? (
                    <span className="rounded-full bg-[#d4af37]/20 px-2 py-0.5 text-xs text-[#ffe08a]">
                      Company
                    </span>
                  ) : (
                    <span className="text-[#8a7f66]">Individual</span>
                  )}
                </td>
                <td className="px-4 py-3">{r.company ?? "-"}</td>
                <td className="px-4 py-3 capitalize">{r.gender}</td>
                <td className="px-4 py-3 capitalize">{r.device ?? "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[#8a7f66]"
                >
                  No visitors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Open /admin/visitors?key=YOUR_ADMIN_KEY. Anyone without the key sees a normal 404. */
export default function VisitorsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  return (
    <main className="min-h-dvh bg-[#0b0a09] p-4 text-[#f4ede0] sm:p-8">
      <h1 className="font-display text-2xl text-[#ffe08a]">Visitors</h1>
      <Suspense
        fallback={<p className="mt-4 text-sm text-[#8a7f66]">Loading…</p>}
      >
        <VisitorsTable searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
