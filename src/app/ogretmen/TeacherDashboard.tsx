"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";

export type TeacherClass = {
  id: string;
  name: string;
  created_at: string;
  class_members: {
    id: string;
    student_name: string;
    created_at: string;
    parent: { full_name: string; email: string } | null;
  }[];
};

export function TeacherDashboard({
  teacherId,
  schoolId,
  name,
  classes,
  pendingByClass,
}: {
  teacherId: string;
  schoolId: string;
  name: string;
  classes: TeacherClass[];
  pendingByClass: Record<string, number>;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    router.refresh();
  }

  async function deleteClass(c: TeacherClass) {
    if (!confirm(`"${c.name}" sınıfı ve tüm veli eşleşmeleri silinsin mi?`)) return;
    const { error } = await createClient().from("classes").delete().eq("id", c.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Merhaba{name ? `, ${name.split(" ")[0]}` : ""} 👋</h1>
        <p className="mt-1 text-slate-600">
          Sınıf grubunuzu oluşturun. Veliler okulunuzdaki sınıfları görüp öğrencilerinin sınıfına katılacak.
        </p>
      </div>

      <form onSubmit={createClass} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:p-5">
        <div className="flex-1">
          <label className="label" htmlFor="cname">Yeni sınıf grubu</label>
          <input id="cname" className="input" placeholder="Örn. 3-A" required maxLength={40}
            value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={busy || !newName.trim()}>
          {busy ? "Oluşturuluyor…" : "Sınıf oluştur"}
        </button>
      </form>

      {error && <Alert>{error}</Alert>}

      {classes.length === 0 ? (
        <div className="card p-8 text-center text-slate-600">
          Henüz sınıf grubunuz yok. Yukarıdan ilk sınıfınızı oluşturun.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <section key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">{c.name}</h2>
                  <p className="text-sm text-slate-500">{c.class_members.length} öğrenci</p>
                </div>
                <button className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => deleteClass(c)}>Sınıfı sil</button>
              </div>
              {pendingByClass[c.id] ? (
                <Link href={`/sinif/${c.id}?sekme=kitap&alt=giris`}
                  className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">
                  🔔 {pendingByClass[c.id]} kitap kaydı onayınızı bekliyor
                </Link>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={`/sinif/${c.id}?sekme=ogrenciler`} className="btn-outline text-sm">Öğrenciler</Link>
                <Link href={`/sinif/${c.id}?sekme=kitap`} className="btn-primary text-sm">📚 Kitap Takip</Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
