"use client";
import { ask } from "@/components/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import type { Member, Reading } from "@/lib/reading-types";
import { Avatar, RankChip } from "@/components/Game";
import { monthRange } from "@/lib/dates";
import { byPages } from "@/lib/game";
import { EmptyPeople } from "@/components/Illustrations";
import { confetti } from "@/lib/confetti";

export function StudentsTab({ members, readings }: { members: Member[]; readings: Reading[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status !== "pending");

  const stats = new Map<string, { books: number; pages: number }>();
  for (const r of readings) {
    if (r.status !== "approved") continue;
    const s = stats.get(r.student_name) ?? { books: 0, pages: 0 };
    s.books += 1;
    s.pages += r.book?.page_count ?? 0;
    stats.set(r.student_name, s);
  }

  // Bu ayın sıralaması (sayfa sayısına göre) → ilk 5 unvanı
  const mr = monthRange();
  const monthly = new Map<string, { student_name: string; book_count: number; page_count: number }>();
  for (const r of readings) {
    if (r.status !== "approved" || r.read_date < mr.from || r.read_date > mr.to) continue;
    const x = monthly.get(r.student_name) ?? { student_name: r.student_name, book_count: 0, page_count: 0 };
    x.book_count += 1;
    x.page_count += r.book?.page_count ?? 0;
    monthly.set(r.student_name, x);
  }
  const monthRank = new Map([...monthly.values()].sort(byPages).map((x, i) => [x.student_name, i]));

  async function remove(m: Member) {
    if (!(await ask({ danger: true, message: <><b>{m.student_name}</b> sınıftan çıkarılsın mı? Okuma kayıtları raporlarda kalır.</> }))) return;
    const { error } = await createClient().from("class_members").delete().eq("id", m.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  async function approve(ids: string[]) {
    setError("");
    setBusy(ids.length > 1 ? "all" : ids[0]);
    const { error } = await createClient().from("class_members").update({ status: "approved" }).in("id", ids);
    setBusy(null);
    if (error) return setError(trError(error));
    confetti(40);
    router.refresh();
  }

  async function reject(m: Member) {
    if (!(await ask({ danger: true, message: <><b>{m.student_name}</b> için katılım isteği reddedilsin mi? Veliye bildirim gider.</> }))) return;
    setBusy(m.id);
    const { error } = await createClient().from("class_members").delete().eq("id", m.id);
    setBusy(null);
    if (error) return setError(trError(error));
    router.refresh();
  }

  return (
    <div className="space-y-4">
    {pending.length > 0 && (
      <section className="card overflow-hidden ring-2 ring-accent/40">
        <div className="flex items-center justify-between gap-3 bg-accent-soft px-4 py-3">
          <h3 className="font-black text-accent-ink">🔔 Onay bekleyen öğrenciler ({pending.length})</h3>
          {pending.length > 1 && (
            <button className="btn-mint px-3 py-1.5 text-sm" disabled={busy === "all"} onClick={() => approve(pending.map((m) => m.id))}>
              Tümünü onayla
            </button>
          )}
        </div>
        <ul className="divide-y divide-line">
          {pending.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={m.student_name} />
                <div className="min-w-0">
                  <p className="font-black text-ink">{m.student_name}</p>
                  <p className="truncate text-sm text-muted">Veli: {m.parent?.full_name || "—"} · {m.parent?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-mint px-3 py-1.5 text-sm" disabled={busy === m.id} onClick={() => approve([m.id])}>✓ Onayla</button>
                <button className="btn-danger px-3 py-1.5 text-sm" disabled={busy === m.id} onClick={() => reject(m)}>Reddet</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    )}
    <section className="card overflow-hidden">
      {error && <div className="p-4"><Alert>{error}</Alert></div>}
      {approved.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <EmptyPeople />
          <p className="font-black text-ink">{pending.length ? "Henüz onaylı öğrenci yok" : "Henüz katılan veli yok"}</p>
          <p className="max-w-sm text-sm text-ink-2">Veliler kayıt olduktan sonra okulunuzdaki sınıflar arasından bu sınıfı seçerek katılır.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {approved.map((m) => {
            const s = stats.get(m.student_name);
            return (
              <li key={m.id} className="flex items-center gap-3 p-4">
                <Avatar name={m.student_name} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-black text-ink">{m.student_name} {monthRank.has(m.student_name) && <RankChip index={monthRank.get(m.student_name)!} />}</p>
                  <p className="truncate text-sm text-muted">
                    Veli: {m.parent?.full_name || "—"} · {m.parent?.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-right text-sm text-ink-2 sm:block">
                    <b className="text-ink">{s?.books ?? 0}</b> kitap · {(s?.pages ?? 0).toLocaleString("tr-TR")} sf
                  </span>
                  <button className="btn-ghost px-2 py-1 text-xs text-danger-ink" onClick={() => remove(m)}>Çıkar</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
    </div>
  );
}
