"use client";
import { ask } from "@/components/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { createClient } from "@/lib/supabase/client";
import { confetti } from "@/lib/confetti";
import { trError } from "@/lib/errors";
import { fmtDate, todayISO } from "@/lib/dates";
import { STATUS_LABEL, type Book, type Member, type Reading, type ReadingStatus } from "@/lib/reading-types";

const STATUS_STYLE: Record<ReadingStatus, string> = {
  pending: "bg-sun-soft text-sun-ink",
  approved: "bg-mint-soft text-mint-ink",
  rejected: "bg-danger-soft text-danger-ink",
};

export function EntryTab({
  classId,
  isStaff,
  members,
  books,
  readings,
  goToBooks,
}: {
  classId: string;
  isStaff: boolean;
  members: Member[];
  books: Book[];
  readings: Reading[];
  goToBooks: () => void;
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(members.length === 1 ? members[0].id : "");
  const [bookId, setBookId] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const pending = readings.filter((r) => r.status === "pending");
  const history = readings.filter((r) => (isStaff ? r.status !== "pending" : true)).slice(0, 40);

  // Seçilen öğrencinin daha önce kaydettiği kitaplar (tekrar seçilmesin)
  const selectedName = members.find((m) => m.id === memberId)?.student_name;
  const alreadyRead = useMemo(
    () => new Set(readings.filter((r) => r.student_name === selectedName && r.status !== "rejected").map((r) => r.book_id)),
    [readings, selectedName],
  );
  // Okunmamışlar önce, en yeni eklenen en üstte; kayıtlılar en altta
  const bookOptions = books
    .filter((b) => b.title.toLocaleLowerCase("tr").includes(q.trim().toLocaleLowerCase("tr")))
    .sort(
      (a, b) =>
        Number(alreadyRead.has(a.id)) - Number(alreadyRead.has(b.id)) ||
        (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setOk("");
    if (!memberId) return setError("Öğrenci seçin.");
    if (!bookId) return setError("Kitap seçin.");
    setBusy("save");
    const { error } = await createClient()
      .from("readings")
      .insert({ class_id: classId, member_id: memberId, book_id: bookId, read_date: todayISO() });
    setBusy(null);
    if (error) return setError(trError(error));
    const book = books.find((b) => b.id === bookId)?.title;
    setOk(
      isStaff
        ? `${selectedName} — "${book}" kaydedildi.`
        : `${selectedName} — "${book}" kaydedildi. Öğretmen onayından sonra raporlara eklenecek.`,
    );
    confetti(isStaff ? 40 : 80);
    setBookId(""); setQ("");
    if (members.length > 1) setMemberId("");
    router.refresh();
  }

  async function setStatus(ids: string[], status: ReadingStatus) {
    setError(""); setOk("");
    setBusy(ids.length > 1 ? "all" : ids[0]);
    const { error } = await createClient().from("readings").update({ status }).in("id", ids);
    setBusy(null);
    if (error) return setError(trError(error));
    setOk(status === "approved" ? `${ids.length} kayıt onaylandı.` : "Kayıt reddedildi.");
    if (status === "approved") confetti(40);
    router.refresh();
  }

  async function remove(r: Reading) {
    if (!(await ask({ danger: true, message: <><b>{r.student_name}</b> — “{r.book?.title}” kaydı silinsin mi?</> }))) return;
    setError(""); setOk("");
    const { error } = await createClient().from("readings").delete().eq("id", r.id);
    if (error) return setError(trError(error));
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
        Sınıfta henüz öğrenci yok. Veliler sınıfa katıldığında öğrenciler burada listelenecek.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {books.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-2">
          Kitaplık boş. Önce{" "}
          <button className="link" onClick={goToBooks}>Kitap Ekleme</button> sekmesinden kitap ekleyin.
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4 rounded-2xl bg-surface-2 p-4 ring-1 ring-line">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="student">Öğrenci</label>
              {isStaff ? (
                <select id="student" className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                  <option value="">Öğrenci seçin</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.student_name}</option>
                  ))}
                </select>
              ) : members.length === 1 ? (
                <div className="input bg-surface font-bold">{members[0].student_name}</div>
              ) : (
                <select id="student" className="input" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                  <option value="">Öğrenci seçin</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.student_name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="label" htmlFor="book-search">Kitap</label>
              <input id="book-search" className="input mb-2" placeholder="🔎 Kitap adı yazın…" value={q}
                onChange={(e) => setQ(e.target.value)} autoComplete="off" />
              <div role="radiogroup" aria-label="Kitap seçin"
                className="max-h-72 space-y-1.5 overflow-y-auto rounded-2xl bg-surface p-1.5 ring-1 ring-line">
                {bookOptions.length === 0 && (
                  <p className="p-3 text-center text-sm text-muted">
                    Bu isimde kitap yok.{" "}
                    <button type="button" className="link" onClick={goToBooks}>Kitap Ekleme</button>’den ekleyebilirsiniz.
                  </p>
                )}
                {bookOptions.map((b) => {
                  const done = alreadyRead.has(b.id);
                  const sel = bookId === b.id;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      key={b.id}
                      disabled={done}
                      onClick={() => setBookId(b.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        sel ? "bg-primary-soft ring-2 ring-primary" : done ? "opacity-50" : "hover:bg-surface-2"
                      }`}
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${sel ? "border-primary bg-primary text-[10px] text-white" : "border-line"}`} aria-hidden>
                        {sel ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-extrabold text-ink">{b.title}</span>
                        <span className="text-xs text-muted">{b.page_count} sayfa</span>
                      </span>
                      {done && <span className="chip bg-mint-soft text-mint-ink">✓ kayıtlı</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Tarih: <b className="text-ink-2">{fmtDate(todayISO())}</b> (cihazınızın tarihi)
            </p>
            <button className="btn-accent sm:w-44" disabled={busy === "save" || !memberId || !bookId}>
              {busy === "save" ? "Kaydediliyor…" : "📖 Kaydet"}
            </button>
          </div>
          {!isStaff && (
            <p className="text-xs text-muted">Veli kayıtları öğretmen onayından sonra raporlara ve sıralamaya dahil edilir.</p>
          )}
        </form>
      )}

      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      {isStaff && (
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-black text-ink">
              Onay bekleyen veli kayıtları <span className="text-muted">({pending.length})</span>
            </h3>
            {pending.length > 1 && (
              <button className="btn-mint px-3 py-1.5 text-sm" disabled={busy === "all"}
                onClick={() => setStatus(pending.map((p) => p.id), "approved")}>
                Tümünü onayla
              </button>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="rounded-2xl bg-surface-2 p-4 text-center text-sm text-muted">Onay bekleyen kayıt yok.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-sun/50">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 bg-sun-soft p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{r.student_name}</p>
                    <p className="truncate text-sm text-ink-2">
                      {r.book?.title} · {r.book?.page_count} sf · {fmtDate(r.read_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-mint px-3 py-1.5 text-sm" disabled={busy === r.id}
                      onClick={() => setStatus([r.id], "approved")}>✓ Onayla</button>
                    <button className="btn-danger px-3 py-1.5 text-sm" disabled={busy === r.id}
                      onClick={() => setStatus([r.id], "rejected")}>Reddet</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-black text-ink">{isStaff ? "Son kayıtlar" : "Kayıtlarım"}</h3>
        {history.length === 0 ? (
          <p className="rounded-2xl bg-surface-2 p-4 text-center text-sm text-muted">Henüz kayıt yok.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
            {history.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {isStaff && <span>{r.student_name} · </span>}
                    {r.book?.title}
                  </p>
                  <p className="text-sm text-muted">
                    {r.book?.page_count} sf · {fmtDate(r.read_date)}
                  </p>
                </div>
                <span className={`shrink-0 chip ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                {(isStaff || r.status !== "approved") && (
                  <button className="btn-ghost shrink-0 px-2 py-1 text-xs text-danger-ink" onClick={() => remove(r)}>Sil</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
