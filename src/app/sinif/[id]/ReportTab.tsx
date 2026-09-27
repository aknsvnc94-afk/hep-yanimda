"use client";
import { useMemo, useState } from "react";
import { RankingChart } from "@/components/RankingChart";
import { fmtDate, monthRange, todayISO, weekRange } from "@/lib/dates";
import type { Member, RankRow, Reading } from "@/lib/reading-types";

type Period = "hafta" | "ay" | "tum" | "ozel";

export function ReportTab({
  className,
  members,
  readings,
}: {
  className: string;
  members: Member[];
  readings: Reading[];
}) {
  const [period, setPeriod] = useState<Period>("ay");
  const [from, setFrom] = useState(monthRange().from);
  const [to, setTo] = useState(todayISO());
  const [open, setOpen] = useState<string | null>(null);

  const range = useMemo(() => {
    if (period === "hafta") return weekRange();
    if (period === "ay") return monthRange();
    if (period === "tum") return { from: "0000-01-01", to: "9999-12-31" };
    return { from, to };
  }, [period, from, to]);

  const approved = useMemo(
    () => readings.filter((r) => r.status === "approved" && r.read_date >= range.from && r.read_date <= range.to),
    [readings, range],
  );

  const rows = useMemo(() => {
    const map = new Map<string, RankRow & { items: Reading[] }>();
    for (const m of members) map.set(m.student_name, { student_name: m.student_name, book_count: 0, page_count: 0, items: [] });
    for (const r of approved) {
      const row = map.get(r.student_name) ?? { student_name: r.student_name, book_count: 0, page_count: 0, items: [] };
      row.book_count += 1;
      row.page_count += r.book?.page_count ?? 0;
      row.items.push(r);
      map.set(r.student_name, row);
    }
    return [...map.values()].sort(
      (a, b) => b.book_count - a.book_count || b.page_count - a.page_count || a.student_name.localeCompare(b.student_name, "tr"),
    );
  }, [members, approved]);

  const totalBooks = approved.length;
  const totalPages = approved.reduce((s, r) => s + (r.book?.page_count ?? 0), 0);
  const readers = rows.filter((r) => r.book_count > 0).length;

  function downloadCsv() {
    const lines = [["Öğrenci", "Kitap sayısı", "Toplam sayfa"].join(";")];
    rows.forEach((r) => lines.push([r.student_name, r.book_count, r.page_count].join(";")));
    lines.push("", ["Öğrenci", "Kitap", "Sayfa", "Tarih"].join(";"));
    approved.forEach((r) => lines.push([r.student_name, r.book?.title ?? "", r.book?.page_count ?? 0, fmtDate(r.read_date)].join(";")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${className}-kitap-raporu-${period === "tum" ? "tum" : range.from + "_" + range.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const periods: [Period, string][] = [["hafta", "Bu hafta"], ["ay", "Bu ay"], ["tum", "Tüm zamanlar"], ["ozel", "Tarih aralığı"]];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {periods.map(([k, l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                period === k ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {l}
            </button>
          ))}
        </div>
        <button className="btn-outline px-3 py-1.5 text-sm" onClick={downloadCsv}>⬇ Excel (CSV) indir</button>
      </div>

      {period === "ozel" && (
        <div className="grid grid-cols-2 gap-3 sm:w-96">
          <div>
            <label className="label">Başlangıç</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Bitiş</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}
      {period !== "tum" && (
        <p className="text-sm text-slate-500">{fmtDate(range.from)} – {fmtDate(range.to)} · sadece onaylı kayıtlar</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Okunan kitap", totalBooks.toLocaleString("tr-TR")],
          ["Toplam sayfa", totalPages.toLocaleString("tr-TR")],
          ["Okuyan öğrenci", `${readers} / ${members.length}`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 sm:p-4">
            <p className="text-xs font-semibold text-slate-500 sm:text-sm">{l}</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl">{v}</p>
          </div>
        ))}
      </div>

      {totalBooks > 0 && (
        <div>
          <h3 className="mb-3 font-extrabold">Öğrenci sıralaması</h3>
          <RankingChart rows={rows.filter((r) => r.book_count > 0)} limit={10} />
        </div>
      )}

      <div>
        <h3 className="mb-3 font-extrabold">Öğrenci bazında detay</h3>
        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Öğrenci</th>
                <th className="px-3 py-2 text-right font-semibold">Kitap</th>
                <th className="px-3 py-2 text-right font-semibold">Sayfa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <FragmentRow key={r.student_name} row={r} open={open === r.student_name}
                  toggle={() => setOpen(open === r.student_name ? null : r.student_name)} />
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-500">Öğrenci yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ row, open, toggle }: { row: RankRow & { items: Reading[] }; open: boolean; toggle: () => void }) {
  return (
    <>
      <tr className={row.book_count ? "cursor-pointer hover:bg-slate-50" : "text-slate-400"} onClick={row.book_count ? toggle : undefined}>
        <td className="px-3 py-2.5 font-bold">
          {row.book_count > 0 && <span className="mr-1 text-xs text-slate-400">{open ? "▼" : "▶"}</span>}
          {row.student_name}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{row.book_count}</td>
        <td className="px-3 py-2.5 text-right tabular-nums">{row.page_count.toLocaleString("tr-TR")}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={3} className="bg-slate-50 px-3 py-2">
            <ul className="space-y-1">
              {row.items.map((r) => (
                <li key={r.id} className="flex justify-between gap-3 text-slate-600">
                  <span className="truncate">📖 {r.book?.title} ({r.book?.page_count} sf)</span>
                  <span className="shrink-0 tabular-nums">{fmtDate(r.read_date)}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
