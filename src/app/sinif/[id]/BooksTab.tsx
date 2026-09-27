"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import type { Book, Reading } from "@/lib/reading-types";

export function BooksTab({
  classId,
  isStaff,
  books,
  readings,
}: {
  classId: string;
  isStaff: boolean;
  books: Book[];
  readings: Reading[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [eTitle, setETitle] = useState("");
  const [ePages, setEPages] = useState("");

  const readCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of readings) if (r.status === "approved") m.set(r.book_id, (m.get(r.book_id) ?? 0) + 1);
    return m;
  }, [readings]);

  const list = books.filter((b) => b.title.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setOk("");
    const n = parseInt(pages, 10);
    if (!n || n < 1) return setError("Sayfa sayısını doğru girin.");
    setBusy(true);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("books")
      .insert({ class_id: classId, title: title.trim(), page_count: n, created_by: u.user?.id });
    setBusy(false);
    if (error) return setError(trError(error));
    setOk(`"${title.trim()}" kitaplığa eklendi.`);
    setTitle(""); setPages("");
    router.refresh();
  }

  async function saveEdit(b: Book) {
    setError(""); setOk("");
    const n = parseInt(ePages, 10);
    if (!eTitle.trim() || !n) return setError("Kitap adı ve sayfa sayısı gerekli.");
    const { error } = await createClient().from("books").update({ title: eTitle.trim(), page_count: n }).eq("id", b.id);
    if (error) return setError(trError(error));
    setEditId(null);
    setOk("Kitap güncellendi.");
    router.refresh();
  }

  async function remove(b: Book) {
    if (!confirm(`"${b.title}" kitaplıktan silinsin mi?`)) return;
    setError(""); setOk("");
    const { error } = await createClient().from("books").delete().eq("id", b.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="btitle">Kitap adı</label>
          <input id="btitle" className="input" required maxLength={150} value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Küçük Prens" />
        </div>
        <div>
          <label className="label" htmlFor="bpages">Sayfa sayısı</label>
          <input id="bpages" className="input" required type="number" inputMode="numeric" min={1} max={5000}
            value={pages} onChange={(e) => setPages(e.target.value)} placeholder="96" />
        </div>
        <button className="btn-primary" disabled={busy || !title.trim() || !pages}>
          {busy ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>

      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-extrabold">Sınıf kitaplığı <span className="text-slate-400">({books.length})</span></h3>
          {books.length > 5 && (
            <input className="input sm:w-64" placeholder="Kitap ara…" value={q} onChange={(e) => setQ(e.target.value)} />
          )}
        </div>
        {books.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Kitaplık boş. Yukarıdan ilk kitabı ekleyin.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {list.map((b) => (
              <li key={b.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                {editId === b.id ? (
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_7rem]">
                    <input className="input" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
                    <input className="input" type="number" min={1} max={5000} value={ePages} onChange={(e) => setEPages(e.target.value)} />
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{b.title}</p>
                    <p className="text-sm text-slate-500">
                      {b.page_count} sayfa
                      {isStaff && ` · ${readCount.get(b.id) ?? 0} öğrenci okudu`}
                    </p>
                  </div>
                )}
                {isStaff && (
                  <div className="flex gap-2">
                    {editId === b.id ? (
                      <>
                        <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => saveEdit(b)}>Kaydet</button>
                        <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setEditId(null)}>Vazgeç</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-outline px-3 py-1.5 text-sm"
                          onClick={() => { setEditId(b.id); setETitle(b.title); setEPages(String(b.page_count)); }}>
                          Düzenle
                        </button>
                        <button className="btn-danger px-3 py-1.5 text-sm" onClick={() => remove(b)}>Sil</button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ))}
            {list.length === 0 && <li className="p-4 text-center text-sm text-slate-500">Eşleşen kitap yok.</li>}
          </ul>
        )}
        {!isStaff && books.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">Kayıtlı kitaplarda düzeltme gerekirse öğretmeninize bildirin.</p>
        )}
      </div>
    </div>
  );
}
