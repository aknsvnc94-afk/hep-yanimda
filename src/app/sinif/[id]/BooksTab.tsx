"use client";
import { ask } from "@/components/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import type { Book, Member, Reading } from "@/lib/reading-types";
import { todayISO } from "@/lib/dates";
import { confetti } from "@/lib/confetti";
import { HUE_CLASSES, hueFor } from "@/lib/game";
import { EmptyBooks } from "@/components/Illustrations";
import { bookKey } from "@/lib/book-key";

export function BooksTab({
  classId,
  isStaff,
  books,
  readings,
  members = [],
}: {
  classId: string;
  isStaff: boolean;
  books: Book[];
  readings: Reading[];
  members?: Member[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  // Veli kitap ekleyince: "okudu olarak kaydedilsin mi?" sorusu
  const [offer, setOffer] = useState<{ id: string; title: string } | null>(null);
  const me = !isStaff ? members[0] : undefined;
  const alreadyRead = (bookId: string) =>
    readings.some((r) => r.book_id === bookId && r.status !== "rejected" && r.student_name === me?.student_name);

  async function markRead(book: { id: string; title: string }) {
    if (!me) return;
    setError(""); setOk(""); setBusy(true);
    const { error } = await createClient()
      .from("readings")
      .insert({ class_id: classId, member_id: me.id, book_id: book.id, read_date: todayISO() });
    setBusy(false);
    setOffer(null);
    if (error) return setError(trError(error));
    confetti(80);
    setOk(`📖 ${me.student_name} — "${book.title}" okundu olarak kaydedildi. Öğretmen onayından sonra raporlara eklenecek.`);
    router.refresh();
  }
  const [editId, setEditId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "az">("new");
  const [now] = useState(() => Date.now());
  const [eTitle, setETitle] = useState("");
  const [ePages, setEPages] = useState("");

  const readCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of readings) if (r.status === "approved") m.set(r.book_id, (m.get(r.book_id) ?? 0) + 1);
    return m;
  }, [readings]);

  const typedKey = bookKey(title);
  const duplicate = typedKey ? books.find((b) => bookKey(b.title) === typedKey) : undefined;
  const similar = !duplicate && typedKey.length >= 3
    ? books.filter((b) => bookKey(b.title).includes(typedKey) || typedKey.includes(bookKey(b.title))).slice(0, 3)
    : [];
  const editDuplicate = editId && eTitle ? books.find((b) => b.id !== editId && bookKey(b.title) === bookKey(eTitle)) : undefined;

  // Son eklenen kitaplar en üstte (yeni eklenen kitap listede kaybolmasın)
  const list = books
    .filter((b) => b.title.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")))
    .sort((a, b) =>
      sort === "new"
        ? (b.created_at ?? "").localeCompare(a.created_at ?? "")
        : a.title.localeCompare(b.title, "tr"),
    );
  const isNew = (b: Book) => !!b.created_at && now - new Date(b.created_at).getTime() < 3 * 24 * 3600 * 1000;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setOk("");
    const n = parseInt(pages, 10);
    if (duplicate) {
      if (me && !alreadyRead(duplicate.id)) {
        setOffer({ id: duplicate.id, title: duplicate.title });
        return;
      }
      return setError(`"${duplicate.title}" kitaplıkta zaten var.`);
    }
    if (!n || n < 1) return setError("Sayfa sayısını doğru girin.");
    setBusy(true);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from("books")
      .insert({ class_id: classId, title: title.trim(), page_count: n, created_by: u.user?.id })
      .select("id,title")
      .single();
    setBusy(false);
    if (error) return setError(trError(error));
    if (me && created) setOffer({ id: created.id, title: created.title });
    setOk(`"${title.trim()}" kitaplığa eklendi. Listenin en üstünde görebilirsiniz.`);
    setJustAdded(bookKey(title));
    setQ("");
    setSort("new");
    setTitle(""); setPages("");
    router.refresh();
  }

  async function saveEdit(b: Book) {
    setError(""); setOk("");
    const n = parseInt(ePages, 10);
    if (!eTitle.trim() || !n) return setError("Kitap adı ve sayfa sayısı gerekli.");
    if (editDuplicate) return setError(`"${editDuplicate.title}" adlı bir kitap zaten var.`);
    const { error } = await createClient().from("books").update({ title: eTitle.trim(), page_count: n }).eq("id", b.id);
    if (error) return setError(trError(error));
    setEditId(null);
    setOk("Kitap güncellendi.");
    router.refresh();
  }

  async function remove(b: Book) {
    if (!(await ask({ danger: true, message: <>“<b>{b.title}</b>” kitaplıktan silinsin mi?</> }))) return;
    setError(""); setOk("");
    const { error } = await createClient().from("books").delete().eq("id", b.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="grid gap-3 rounded-3xl bg-gradient-to-br from-mint-soft to-surface-2 p-4 ring-1 ring-line sm:grid-cols-[1fr_9rem_auto] sm:items-start sm:p-5">
        <div>
          <label className="label" htmlFor="btitle">Kitap adı</label>
          <input id="btitle" className="input" required maxLength={150} value={title}
            onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Küçük Prens" />
          {duplicate && (
            <p className="mt-1.5 text-xs font-extrabold text-danger-ink">
              ⚠️ “{duplicate.title}” kitaplıkta zaten var.
              {me && !alreadyRead(duplicate.id) && (
                <button type="button" className="ml-1 underline" onClick={() => setOffer({ id: duplicate.id, title: duplicate.title })}>
                  Okundu olarak kaydet
                </button>
              )}
            </p>
          )}
          {similar.length > 0 && (
            <p className="mt-1.5 text-xs font-bold text-sun-ink">Benzer: {similar.map((b) => `“${b.title}”`).join(", ")}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="bpages">Sayfa sayısı</label>
          <input id="bpages" className="input" required type="number" inputMode="numeric" min={1} max={5000}
            value={pages} onChange={(e) => setPages(e.target.value)} placeholder="96" />
        </div>
        <button className="btn-mint sm:mt-7" disabled={busy || !title.trim() || (!duplicate && !pages) || (!!duplicate && !me)}>
          {busy ? "Kaydediliyor…" : "➕ Kaydet"}
        </button>
      </form>

      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}
      {offer && me && (
        <div className="card animate-pop space-y-3 p-4 ring-2 ring-accent/50">
          <p className="font-black text-ink">
            📖 <b>{me.student_name}</b> “{offer.title}” kitabını okudu mu?
          </p>
          <p className="text-sm text-ink-2">
            Kitabı kitaplığa eklemek, okundu olarak kaydetmez. Okuduysa aşağıdan kaydedin; öğretmen onayına gider.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="btn-accent" disabled={busy} onClick={() => markRead(offer)}>
              {busy ? "Kaydediliyor…" : "Evet, okundu olarak kaydet"}
            </button>
            <button className="btn-outline" onClick={() => setOffer(null)}>Hayır, sadece kitaplıkta kalsın</button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-black text-ink">📚 Sınıf kitaplığı <span className="text-muted">({books.length})</span></h3>
          {books.length > 1 && (
            <div className="flex gap-2">
              {books.length > 5 && (
                <input className="input sm:w-56" placeholder="Kitap ara…" value={q} onChange={(e) => setQ(e.target.value)} />
              )}
              <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as "new" | "az")} aria-label="Sıralama">
                <option value="new">En yeni</option>
                <option value="az">A → Z</option>
              </select>
            </div>
          )}
        </div>
        {books.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-center">
            <EmptyBooks className="h-20 w-20" />
            <p className="text-sm font-bold text-ink-2">Kitaplık boş. Yukarıdan ilk kitabı ekleyin.</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((b) => {
              const h = HUE_CLASSES[hueFor(b.title)];
              const n = readCount.get(b.id) ?? 0;
              return (
                <li key={b.id} className={`card flex overflow-hidden ${justAdded === bookKey(b.title) ? "animate-pop ring-2 ring-mint" : ""}`}>
                  <span className={`w-3 shrink-0 ${h.bg}`} aria-hidden />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
                    {editId === b.id ? (
                      <div className="grid gap-2">
                        <input className="input" value={eTitle} onChange={(e) => setETitle(e.target.value)} />
                        <input className="input" type="number" min={1} max={5000} value={ePages} onChange={(e) => setEPages(e.target.value)} />
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className={`grid h-11 w-9 shrink-0 place-items-center rounded-md text-lg ${h.soft}`} aria-hidden>📘</span>
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-black leading-snug text-ink">{b.title}</p>
                          <p className="mt-0.5 text-xs font-bold text-muted">
                            {isNew(b) && <span className="chip mr-1.5 bg-mint-soft text-mint-ink">Yeni</span>}
                            {b.page_count} sayfa
                            {isStaff && n > 0 && <span className="text-mint-ink"> · {n} öğrenci okudu</span>}
                          </p>
                        </div>
                      </div>
                    )}
                    {isStaff && (
                      <div className="mt-auto flex gap-2">
                        {editId === b.id ? (
                          <>
                            <button className="btn-primary flex-1 px-3 py-1.5 text-sm" onClick={() => saveEdit(b)}>Kaydet</button>
                            <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setEditId(null)}>Vazgeç</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-outline flex-1 px-3 py-1.5 text-xs"
                              onClick={() => { setEditId(b.id); setETitle(b.title); setEPages(String(b.page_count)); }}>
                              ✏️ Düzenle
                            </button>
                            <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => remove(b)} aria-label="Sil">🗑️</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {list.length === 0 && <li className="p-4 text-center text-sm text-muted sm:col-span-2 lg:col-span-3">Eşleşen kitap yok.</li>}
          </ul>
        )}
        {!isStaff && books.length > 0 && (
          <p className="mt-2 text-xs text-muted">Kayıtlı kitaplarda düzeltme gerekirse öğretmeninize bildirin.</p>
        )}
      </div>
    </div>
  );
}
