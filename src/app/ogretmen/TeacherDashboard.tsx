"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Avatar, SectionTitle, StatTile } from "@/components/Game";
import { Hero, todayLong } from "@/components/Hero";
import { EmptyBooks } from "@/components/Illustrations";
import { confetti } from "@/lib/confetti";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import { HUE_CLASSES, hueFor } from "@/lib/game";
import { monthName } from "@/lib/dates";

export type TeacherClass = { id: string; name: string; created_at: string; class_members: { id: string }[] };
export type ClassStat = { pending: number; books: number; pages: number; top: { name: string; books: number } | null };

export function TeacherDashboard({
  teacherId,
  schoolId,
  name,
  classes,
  stats,
}: {
  teacherId: string;
  schoolId: string;
  name: string;
  classes: TeacherClass[];
  stats: Record<string, ClassStat>;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(classes.length === 0);

  const totalStudents = classes.reduce((s, c) => s + c.class_members.length, 0);
  const all = Object.values(stats);
  const monthBooks = all.reduce((s, x) => s + x.books, 0);
  const monthPages = all.reduce((s, x) => s + x.pages, 0);
  const pending = all.reduce((s, x) => s + x.pending, 0);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await createClient()
      .from("classes")
      .insert({ name: newName.trim(), teacher_id: teacherId, school_id: schoolId });
    setBusy(false);
    if (error) return setError(trError(error));
    setNewName("");
    setShowForm(false);
    confetti(50);
    router.refresh();
  }

  async function deleteClass(c: TeacherClass) {
    if (!confirm(`"${c.name}" sınıfı ve tüm kayıtları silinsin mi? Bu işlem geri alınamaz.`)) return;
    const { error } = await createClient().from("classes").delete().eq("id", c.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Hero
        title={<>Merhaba{name ? `, ${name.split(" ")[0]} Hocam` : ""} 👋</>}
        subtitle={todayLong()}
        right={
          pending > 0 ? (
            <Link href={`/sinif/${Object.entries(stats).find(([, s]) => s.pending)?.[0]}?sekme=kitap&alt=giris`}
              className="btn bg-white text-[#4424cc] shadow-[0_4px_0_0_rgb(0_0_0/0.15)]">
              🔔 {pending} kayıt onay bekliyor
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon="🏫" label="Sınıf" value={classes.length} hue="sky" />
        <StatTile icon="🧒" label="Öğrenci" value={totalStudents} hue="mint" />
        <StatTile icon="📚" label={`${monthName()} okunan`} value={monthBooks} hint={`${monthPages.toLocaleString("tr-TR")} sayfa`} hue="primary" />
        <StatTile icon="🔔" label="Onay bekleyen" value={pending} hue={pending ? "accent" : "sun"} />
      </div>

      {error && <Alert>{error}</Alert>}

      <div>
        <SectionTitle icon="🎒" right={
          !showForm && <button className="btn-primary px-3 py-2 text-sm" onClick={() => setShowForm(true)}>＋ Yeni sınıf</button>
        }>
          Sınıflarım
        </SectionTitle>

        {showForm && (
          <form onSubmit={createClass} className="card mb-4 flex animate-rise flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
            <div className="flex-1">
              <label className="label" htmlFor="cname">Sınıf grubunun adı</label>
              <input id="cname" className="input" placeholder="Örn. 3-A" required maxLength={40} autoFocus
                value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {classes.length > 0 && <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Vazgeç</button>}
              <button className="btn-primary" disabled={busy || !newName.trim()}>{busy ? "Oluşturuluyor…" : "Sınıfı oluştur"}</button>
            </div>
          </form>
        )}

        {classes.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-8 text-center">
            <EmptyBooks />
            <p className="font-black text-ink">Henüz sınıf grubun yok</p>
            <p className="max-w-sm text-sm text-ink-2">İlk sınıfını oluştur; veliler okulundaki sınıfları görüp öğrencilerinin sınıfına katılacak.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((c, i) => {
              const h = HUE_CLASSES[hueFor(c.name)];
              const s = stats[c.id];
              return (
                <section key={c.id} className="card flex animate-rise flex-col overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className={`relative bg-gradient-to-br p-5 text-white ${h.grad}`}>
                    <span className="pointer-events-none absolute -right-4 -top-6 text-7xl opacity-20" aria-hidden>📚</span>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-white/80">Sınıf</p>
                    <h3 className="text-3xl font-black">{c.name}</h3>
                    <p className="text-sm font-bold text-white/90">{c.class_members.length} öğrenci</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-2xl bg-surface-2 p-2.5">
                        <p className="text-xl font-black tabular-nums text-ink">{s?.books ?? 0}</p>
                        <p className="text-[11px] font-bold text-muted">bu ay kitap</p>
                      </div>
                      <div className="rounded-2xl bg-surface-2 p-2.5">
                        <p className="text-xl font-black tabular-nums text-ink">{(s?.pages ?? 0).toLocaleString("tr-TR")}</p>
                        <p className="text-[11px] font-bold text-muted">bu ay sayfa</p>
                      </div>
                    </div>
                    {s?.top && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-sun-soft px-3 py-2">
                        <Avatar name={s.top.name} size="sm" />
                        <p className="min-w-0 flex-1 truncate text-sm text-sun-ink">
                          <b>Ayın okuru:</b> {s.top.name}
                        </p>
                        <span className="text-sm font-black text-sun-ink">🏆 {s.top.books}</span>
                      </div>
                    )}
                    {s?.pending ? (
                      <Link href={`/sinif/${c.id}?sekme=kitap&alt=giris`}
                        className="flex items-center justify-between rounded-2xl bg-accent-soft px-3 py-2 text-sm font-extrabold text-accent-ink hover:brightness-95">
                        <span>🔔 {s.pending} kayıt onayını bekliyor</span>
                        <span aria-hidden>→</span>
                      </Link>
                    ) : null}
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                      <Link href={`/sinif/${c.id}?sekme=ogrenciler`} className="btn-outline text-sm">🧒 Öğrenciler</Link>
                      <Link href={`/sinif/${c.id}?sekme=kitap`} className="btn-primary text-sm">📚 Kitap Takip</Link>
                    </div>
                    <button className="self-center text-xs font-bold text-muted hover:text-danger-ink" onClick={() => deleteClass(c)}>
                      Sınıfı sil
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
