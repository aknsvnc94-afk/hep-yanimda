"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";

export type SchoolClass = { id: string; name: string; teacher: { full_name: string } | null };
export type Membership = { id: string; class_id: string; student_name: string };

export function ParentDashboard({
  parentId,
  name,
  studentName,
  classes,
  memberships,
}: {
  parentId: string;
  name: string;
  studentName: string;
  classes: SchoolClass[];
  memberships: Membership[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const mine = memberships.find((m) => m.student_name === studentName) ?? memberships[0];
  const myClass = mine ? classes.find((c) => c.id === mine.class_id) : undefined;

  const filtered = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    if (!s) return classes;
    return classes.filter(
      (c) =>
        c.name.toLocaleLowerCase("tr").includes(s) ||
        (c.teacher?.full_name ?? "").toLocaleLowerCase("tr").includes(s),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Merhaba{name ? `, ${name.split(" ")[0]}` : ""} 👋</h1>
        <p className="mt-1 text-slate-600">
          Öğrenci: <b>{studentName || "—"}</b>
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      {mine ? (
        <section className="card overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-5 text-white">
            <p className="text-sm font-semibold opacity-90">Sınıfınız</p>
            <p className="mt-1 text-3xl font-extrabold">{myClass?.name ?? "—"}</p>
            <p className="mt-1 text-sm opacity-90">Öğretmen: {myClass?.teacher?.full_name || "—"}</p>
          </div>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              <b>{mine.student_name}</b> bu sınıfa kayıtlı. Öğretmeninizle eşleştiniz ✔
            </p>
            <button className="btn-outline text-sm" onClick={leave} disabled={busy === "leave"}>
              Sınıf değiştir / ayrıl
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-extrabold">Öğrencinizin sınıfını seçin</h2>
            <p className="mt-1 text-sm text-slate-600">
              Aşağıda okulunuzdaki öğretmenlerin oluşturduğu sınıflar listeleniyor.
            </p>
            {classes.length > 4 && (
              <input className="input mt-4" placeholder="Sınıf veya öğretmen ara…"
                value={q} onChange={(e) => setQ(e.target.value)} />
            )}
          </div>

          {classes.length === 0 ? (
            <div className="card p-8 text-center text-slate-600">
              Okulunuzda henüz sınıf oluşturulmamış. Öğretmeniniz sınıfı oluşturduğunda burada görünecek.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <li key={c.id} className="card flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold">{c.name}</p>
                    <p className="truncate text-sm text-slate-500">{c.teacher?.full_name || "Öğretmen"}</p>
                  </div>
                  <button className="btn-primary px-3 py-2 text-sm" onClick={() => join(c)} disabled={busy === c.id}>
                    {busy === c.id ? "…" : "Katıl"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
