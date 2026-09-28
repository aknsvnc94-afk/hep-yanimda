"use client";
import { useEffect } from "react";
import { confetti } from "@/lib/confetti";
import type { RankRow } from "@/lib/reading-types";
import { Avatar } from "./Game";
import { Trophy } from "./Illustrations";

const MEDAL = ["🥇", "🥈", "🥉"];

/** Yatay çubuk sıralama: çubuk uzunluğu = kitap sayısı, yanında sayfa. */
export function RankingChart({ rows, limit, highlight, offset = 0 }: { rows: RankRow[]; limit?: number; highlight?: string; offset?: number }) {
  const list = limit ? rows.slice(0, limit) : rows;
  const max = Math.max(1, ...list.map((r) => r.book_count));
  return (
    <ol className="space-y-2">
      {list.map((r, i) => {
        const me = highlight && r.student_name === highlight;
        return (
          <li
            key={r.student_name}
            className={`group grid grid-cols-[1.75rem_minmax(0,7rem)_1fr] items-center gap-2 rounded-xl px-1.5 py-1 text-sm sm:grid-cols-[1.75rem_minmax(0,10rem)_1fr] ${
              me ? "bg-primary-soft" : "hover:bg-surface-2"
            }`}
            title={`${r.student_name}: ${r.book_count} kitap, ${r.page_count} sayfa`}
          >
            <span className="text-center text-base font-black tabular-nums text-muted">{MEDAL[i + offset] ?? i + offset + 1}</span>
            <span className={`truncate font-extrabold ${me ? "text-primary-ink" : "text-ink"}`}>{r.student_name}</span>
            <div className="flex min-w-0 items-center gap-2">
              <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={`h-4 rounded-full ${i + offset === 0 ? "bg-gradient-to-r from-primary to-[#a58bff]" : "bg-primary/55"}`}
                  style={{ width: `${Math.max(6, (r.book_count / max) * 100)}%`, transition: "width .6s ease" }}
                />
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-ink-2">
                <b className="text-ink">{r.book_count}</b> kitap · {r.page_count.toLocaleString("tr-TR")} sf
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** İlk 3 için podyum, geri kalanlar liste */
export function Podium({ rows, highlight }: { rows: RankRow[]; highlight?: string }) {
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]]; // 2 - 1 - 3
  const heights = ["h-16", "h-24", "h-12"];
  const colors = ["bg-sky", "bg-sun", "bg-accent"];
  const places = [2, 1, 3];
  return (
    <div>
      <div className="grid grid-cols-3 items-end gap-2">
        {order.map((r, k) =>
          r ? (
            <div key={r.student_name} className="flex animate-rise flex-col items-center text-center" style={{ animationDelay: `${k * 80}ms` }}>
              {places[k] === 1 && <span className="mb-1 animate-float text-2xl" aria-hidden>👑</span>}
              <Avatar name={r.student_name} size={places[k] === 1 ? "lg" : "md"} />
              <p className={`mt-1 w-full truncate text-sm font-extrabold ${highlight === r.student_name ? "text-primary-ink" : "text-ink"}`}>
                {r.student_name}
              </p>
              <p className="text-xs tabular-nums text-ink-2">
                <b className="text-ink">{r.book_count}</b> kitap · {r.page_count.toLocaleString("tr-TR")} sf
              </p>
              <div className={`mt-2 grid w-full place-items-start justify-center rounded-t-2xl pt-1.5 text-xl font-black text-white ${colors[k]} ${heights[k]}`}>
                {places[k]}
              </div>
            </div>
          ) : (
            <div key={k} />
          ),
        )}
      </div>
      {rows.length > 3 && (
        <div className="mt-3 border-t border-line pt-3">
          <RankingChart rows={rows.slice(3)} limit={2} highlight={highlight} offset={3} />
        </div>
      )}
    </div>
  );
}

/** Haftanın / ayın okuru kartı */
export function ChampionCard({
  title,
  period,
  rows,
  emptyText,
  highlight,
  celebrateKey,
}: {
  title: string;
  period: string;
  rows: RankRow[] | null;
  emptyText: string;
  highlight?: string;
  celebrateKey?: string;
}) {
  const top = rows?.[0];

  // Kendi öğrenciniz birinciyse bir kez konfeti
  useEffect(() => {
    if (!top || !highlight || top.student_name !== highlight || !celebrateKey) return;
    try {
      if (sessionStorage.getItem(celebrateKey)) return;
      sessionStorage.setItem(celebrateKey, "1");
    } catch {}
    const t = setTimeout(() => confetti(), 400);
    return () => clearTimeout(t);
  }, [top, highlight, celebrateKey]);

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-sun-soft to-transparent px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Trophy className="h-8 w-8" />
          <h2 className="text-lg font-black text-ink">{title}</h2>
        </div>
        <span className="chip bg-surface text-ink-2 ring-1 ring-line">{period}</span>
      </div>
      <div className="p-5">
        {rows === null ? (
          <div className="h-40 animate-pulse rounded-2xl bg-surface-3" />
        ) : !top ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 p-6 text-center">
            <span className="text-4xl" aria-hidden>📖</span>
            <p className="text-sm font-semibold text-ink-2">{emptyText}</p>
          </div>
        ) : (
          <Podium rows={rows} highlight={highlight} />
        )}
      </div>
    </section>
  );
}
