import type { RankRow } from "@/lib/reading-types";

/** Yatay çubuk sıralama grafiği: çubuk uzunluğu = kitap sayısı, yanında sayfa. */
export function RankingChart({
  rows,
  limit,
  highlightFirst = true,
}: {
  rows: RankRow[];
  limit?: number;
  highlightFirst?: boolean;
}) {
  const list = limit ? rows.slice(0, limit) : rows;
  const max = Math.max(1, ...list.map((r) => r.book_count));
  return (
    <ol className="space-y-2.5">
      {list.map((r, i) => (
        <li
          key={r.student_name}
          className="grid grid-cols-[1.5rem_minmax(0,7.5rem)_1fr] items-center gap-2 text-sm sm:grid-cols-[1.5rem_minmax(0,10rem)_1fr]"
          title={`${r.student_name}: ${r.book_count} kitap, ${r.page_count} sayfa`}
        >
          <span className="text-right font-extrabold tabular-nums text-slate-400">{i + 1}</span>
          <span className="truncate font-bold text-slate-800">{r.student_name}</span>
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-5 min-w-0 flex-1 rounded-r bg-slate-100">
              <div
                className={`h-5 rounded-r ${highlightFirst && i === 0 ? "bg-brand-600" : "bg-brand-500/70"}`}
                style={{ width: `${Math.max(4, (r.book_count / max) * 100)}%` }}
              />
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-slate-600 tabular-nums">
              <b className="text-slate-900">{r.book_count}</b> kitap · {r.page_count.toLocaleString("tr-TR")} sf
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Birinci öğrenci kartı + ilk 5 sıralama */
export function ChampionCard({
  title,
  period,
  rows,
  emptyText,
}: {
  title: string;
  period: string;
  rows: RankRow[] | null;
  emptyText: string;
}) {
  const top = rows?.[0];
  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <h2 className="font-extrabold">{title}</h2>
        <span className="text-xs font-semibold text-slate-500">{period}</span>
      </div>
      <div className="p-5">
        {rows === null ? (
          <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ) : !top ? (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{emptyText}</p>
        ) : (
          <>
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-amber-50 to-white p-4 ring-1 ring-amber-200">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-400 text-2xl" aria-hidden>
                🏆
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-extrabold">{top.student_name}</p>
                <p className="text-sm text-slate-600">
                  <b className="text-slate-900">{top.book_count}</b> kitap ·{" "}
                  <b className="text-slate-900">{top.page_count.toLocaleString("tr-TR")}</b> sayfa
                </p>
              </div>
            </div>
            {rows.length > 1 && (
              <div className="mt-4">
                <RankingChart rows={rows} limit={5} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
