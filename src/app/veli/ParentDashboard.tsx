"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { Avatar, LevelBadge, ProgressRing, SectionTitle } from "@/components/Game";
import { Hero, todayLong } from "@/components/Hero";
import { EmptyBooks } from "@/components/Illustrations";
import { ChampionCard } from "@/components/RankingChart";
import { confetti } from "@/lib/confetti";
import { fmtDate, monthName, monthRange, weekRange } from "@/lib/dates";
import { trError } from "@/lib/errors";
import { HUE_CLASSES, hueFor, MONTHLY_GOAL } from "@/lib/game";
import { STATUS_LABEL, type RankRow, type Reading } from "@/lib/reading-types";
import { createClient } from "@/lib/supabase/client";

export type SchoolClass = { id: string; name: string; teacher: { full_name: string } | null };
export type Membership = { id: string; class_id: string; student_name: string };

const STATUS_STYLE = {
  pending: "bg-sun-soft text-sun-ink",
  approved: "bg-mint-soft text-mint-ink",
  rejected: "bg-danger-soft text-danger-ink",
} as const;

export function ParentDashboard({
  parentId,
  name,
  studentName,
  classes,
  memberships,
  readings,
}: {
  parentId: string;
  name: string;
  studentName: string;
  classes: SchoolClass[];
  memberships: Membership[];
  readings: Reading[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const mine = memberships.find((m) => m.student_name === studentName) ?? memberships[0];
  const myClass = mine ? classes.find((c) => c.id === mine.class_id) : undefined;
  const student = mine?.student_name ?? studentName;

  const [week, setWeek] = useState<RankRow[] | null>(null);
  const [month, setMonth] = useState<RankRow[] | null>(null);
  const wr = weekRange();
  const mr = monthRange();

  const approved = readings.filter((r) => r.status === "approved");
  const monthBooks = approved.filter((r) => r.read_date >= mr.from && r.read_date <= mr.to).length;
  const totalPages = approved.reduce((s, r) => s + (r.book?.page_count ?? 0), 0);
  const pendingCount = readings.filter((r) => r.status === "pending").length;

  // Haftanın ve ayın sıralaması (cihaz tarihine göre)
  useEffect(() => {
    if (!mine) return;
    const supabase = createClient();
    const load = async (from: string, to: string) => {
      const { data, error } = await supabase.rpc("class_leaderboard", { p_class: mine.class_id, p_from: from, p_to: to });
      if (error) setError(trError(error));
      return ((data ?? []) as RankRow[]).map((r) => ({ ...r, book_count: Number(r.book_count), page_count: Number(r.page_count) }));
    };
    load(wr.from, wr.to).then(setWeek);
    load(mr.from, mr.to).then(setMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.class_id]);

  const filtered = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    if (!s) return classes;
    return classes.filter(
      (c) => c.name.toLocaleLowerCase("tr").includes(s) || (c.teacher?.full_name ?? "").toLocaleLowerCase("tr").includes(s),
    );
  }, [q, classes]);

  async function join(c: SchoolClass) {
    if (!confirm(`${studentName}, "${c.name}" sınıfına kaydedilsin mi?`)) return;
    setError("");
    setBusy(c.id);
    const { error } = await createClient()
      .from("class_members")
      .insert({ class_id: c.id, parent_id: parentId, student_name: studentName });
    setBusy(null);
    if (error) return setError(trError(error));
    confetti();
    router.refresh();
  }

  async function leave() {
    if (!mine || !confirm("Sınıf kaydından ayrılmak istediğinize emin misiniz?")) return;
    setBusy("leave");
    const { error } = await createClient().from("class_members").delete().eq("id", mine.id);
    setBusy(null);
    if (error) return setError(trError(error));
    router.refresh();
  }

  const first = name ? name.split(" ")[0] : "";

  /* ------------------------- Sınıfa katılmamış veli ------------------------- */
  if (!mine) {
    return (
      <div className="space-y-6">
        <Hero title={<>Hoş geldin{first ? `, ${first}` : ""} 👋</>} subtitle="Başlamak için öğrencinin sınıfını seç." />
        {error && <Alert>{error}</Alert>}
        <section>
          <SectionTitle icon="🎒">{studentName} hangi sınıfta?</SectionTitle>
          {classes.length > 4 && (
            <input className="input mb-3" placeholder="Sınıf veya öğretmen ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          )}
          {classes.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-8 text-center">
              <EmptyBooks />
              <p className="font-black text-ink">Okulunda henüz sınıf yok</p>
              <p className="max-w-sm text-sm text-ink-2">Öğretmen sınıfı oluşturduğunda burada görünecek.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c, i) => {
                const h = HUE_CLASSES[hueFor(c.name)];
                return (
                  <li key={c.id} className="card flex animate-rise items-center gap-3 p-4" style={{ animationDelay: `${i * 50}ms` }}>
                    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-black text-white ${h.grad}`}>
                      {c.name.slice(0, 4)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-black text-ink">{c.name}</p>
                      <p className="truncate text-sm text-ink-2">🍎 {c.teacher?.full_name || "Öğretmen"}</p>
                    </div>
                    <button className="btn-mint px-3.5 py-2 text-sm" onClick={() => join(c)} disabled={busy === c.id}>
                      {busy === c.id ? "…" : "Katıl"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    );
  }

  /* ------------------------------ Ana ekran ------------------------------ */
  return (
    <div className="space-y-6">
      <Hero
        title={<>Merhaba{first ? `, ${first}` : ""} 👋</>}
        subtitle={todayLong()}
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-3 backdrop-blur">
          <Avatar name={student} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-black">{student}</p>
            <p className="truncate text-sm font-semibold text-white/85">
              {myClass?.name} · 🍎 {myClass?.teacher?.full_name || "Öğretmen"}
            </p>
          </div>
        </div>
      </Hero>

      {error && <Alert>{error}</Alert>}

      <Link href={`/sinif/${mine.class_id}?sekme=kitap&alt=giris`} className="btn-accent w-full py-4 text-lg">
        📖 Okuduğu kitabı kaydet
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <p className="mb-3 text-sm font-extrabold text-muted">🎖️ Okuma seviyesi</p>
          <LevelBadge books={approved.length} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-2xl bg-surface-2 p-2.5">
              <p className="text-xl font-black tabular-nums text-ink">{approved.length}</p>
              <p className="text-[11px] font-bold text-muted">toplam kitap</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-2.5">
              <p className="text-xl font-black tabular-nums text-ink">{totalPages.toLocaleString("tr-TR")}</p>
              <p className="text-[11px] font-bold text-muted">toplam sayfa</p>
            </div>
          </div>
        </section>

        <section className="card flex items-center gap-4 p-5">
          <ProgressRing value={monthBooks / MONTHLY_GOAL} size={112} stroke={12}
            color={monthBooks >= MONTHLY_GOAL ? "var(--color-mint)" : "var(--color-accent)"}>
            <div>
              <p className="text-3xl font-black tabular-nums leading-none text-ink">{monthBooks}</p>
              <p className="text-xs font-bold text-muted">/ {MONTHLY_GOAL}</p>
            </div>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-muted">🎯 {monthName()} hedefi</p>
            <p className="mt-1 text-lg font-black leading-tight text-ink">
              {monthBooks >= MONTHLY_GOAL ? "Hedef tamam! Süpersin 🎉" : `${MONTHLY_GOAL - monthBooks} kitap kaldı`}
            </p>
            {pendingCount > 0 && (
              <p className="mt-2 inline-block rounded-full bg-sun-soft px-2.5 py-1 text-xs font-extrabold text-sun-ink">
                ⏳ {pendingCount} kayıt öğretmen onayında
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChampionCard title="Haftanın okuru" period={`${fmtDate(wr.from).slice(0, 5)} – ${fmtDate(wr.to).slice(0, 5)}`}
          rows={week} highlight={student} celebrateKey={`kutlama-hafta-${wr.from}`}
          emptyText="Bu hafta henüz onaylı kitap yok. İlk sen ol!" />
        <ChampionCard title="Ayın okuru" period={monthName()}
          rows={month} highlight={student} celebrateKey={`kutlama-ay-${mr.from}`}
          emptyText="Bu ay henüz onaylı kitap yok." />
      </div>
      <p className="-mt-3 text-xs text-muted">
        Sıralama kitap sayısına göre yapılır; eşitlikte toplam sayfa belirler. Sadece öğretmen onaylı kayıtlar sayılır.
      </p>

      <section>
        <SectionTitle icon="🕘" right={
          <Link href={`/sinif/${mine.class_id}?sekme=kitap&alt=giris`} className="text-sm font-extrabold text-primary-ink">Tümü →</Link>
        }>
          Son kayıtlar
        </SectionTitle>
        {readings.length === 0 ? (
          <div className="card p-6 text-center text-sm text-ink-2">Henüz kitap kaydı yok.</div>
        ) : (
          <ul className="card divide-y divide-line">
            {readings.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-lg" aria-hidden>📘</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-ink">{r.book?.title}</p>
                  <p className="text-xs text-muted">{r.book?.page_count} sayfa · {fmtDate(r.read_date)}</p>
                </div>
                <span className={`chip ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="text-center">
        <button className="text-xs font-bold text-muted hover:text-danger-ink" onClick={leave} disabled={busy === "leave"}>
          Sınıf değiştir / ayrıl
        </button>
      </div>
    </div>
  );
}
