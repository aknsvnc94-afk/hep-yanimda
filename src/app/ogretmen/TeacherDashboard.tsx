"use client";
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
}: {
  teacherId: string;
  schoolId: string;
  name: string;
  classes: TeacherClass[];
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

  async function removeMember(id: string, student: string) {
    if (!confirm(`${student} sınıftan çıkarılsın mı?`)) return;
    const { error } = await createClient().from("class_members").delete().eq("id", id);
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
            <section key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">{c.name}</h2>
                  <p className="text-sm text-slate-500">{c.class_members.length} öğrenci / veli</p>
                </div>
                <button className="btn-danger px-3 py-1.5 text-sm" onClick={() => deleteClass(c)}>Sil</button>
              </div>
              {c.class_members.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                  Henüz katılan veli yok.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {[...c.class_members]
                    .sort((a, b) => a.student_name.localeCompare(b.student_name, "tr"))
                    .map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="font-bold">{m.student_name}</p>
                          <p className="truncate text-sm text-slate-500">
                            Veli: {m.parent?.full_name || "—"} · {m.parent?.email}
                          </p>
                        </div>
                        <button className="btn-ghost px-2 py-1 text-xs text-red-600"
                          onClick={() => removeMember(m.id, m.student_name)}>
                          Çıkar
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
