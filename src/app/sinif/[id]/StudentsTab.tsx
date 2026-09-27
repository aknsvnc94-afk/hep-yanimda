"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import type { Member, Reading } from "@/lib/reading-types";

export function StudentsTab({ members, readings }: { members: Member[]; readings: Reading[] }) {
  const router = useRouter();
  const [error, setError] = useState("");

  const stats = new Map<string, { books: number; pages: number }>();
  for (const r of readings) {
    if (r.status !== "approved") continue;
    const s = stats.get(r.student_name) ?? { books: 0, pages: 0 };
    s.books += 1;
    s.pages += r.book?.page_count ?? 0;
    stats.set(r.student_name, s);
  }

  async function remove(m: Member) {
    if (!confirm(`${m.student_name} sınıftan çıkarılsın mı? (Okuma kayıtları raporlarda kalır.)`)) return;
    const { error } = await createClient().from("class_members").delete().eq("id", m.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  return (
    <section className="card overflow-hidden">
      {error && <div className="p-4"><Alert>{error}</Alert></div>}
      {members.length === 0 ? (
        <p className="p-8 text-center text-slate-500">
          Henüz katılan veli yok. Veliler kayıt olduktan sonra okulunuzdaki sınıflar arasından bu sınıfı seçerek katılır.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => {
            const s = stats.get(m.student_name);
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-bold">{m.student_name}</p>
                  <p className="truncate text-sm text-slate-500">
                    Veli: {m.parent?.full_name || "—"} · {m.parent?.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-right text-sm text-slate-600 sm:block">
                    <b className="text-slate-900">{s?.books ?? 0}</b> kitap · {(s?.pages ?? 0).toLocaleString("tr-TR")} sf
                  </span>
                  <button className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => remove(m)}>Çıkar</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
