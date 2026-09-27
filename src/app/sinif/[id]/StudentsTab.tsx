"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import type { Member, Reading } from "@/lib/reading-types";
import { Avatar, LevelBadge } from "@/components/Game";
import { EmptyPeople } from "@/components/Illustrations";

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
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <EmptyPeople />
          <p className="font-black text-ink">Henüz katılan veli yok</p>
          <p className="max-w-sm text-sm text-ink-2">Veliler kayıt olduktan sonra okulunuzdaki sınıflar arasından bu sınıfı seçerek katılır.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {members.map((m) => {
            const s = stats.get(m.student_name);
            return (
              <li key={m.id} className="flex items-center gap-3 p-4">
                <Avatar name={m.student_name} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-black text-ink">{m.student_name} <LevelBadge books={s?.books ?? 0} compact /></p>
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
  );
}
