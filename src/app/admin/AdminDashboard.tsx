"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { StatTile } from "@/components/Game";
import { Hero } from "@/components/Hero";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import { ROLE_LABEL, schoolLabel, type Profile, type Role, type School } from "@/lib/types";

export type AdminClass = {
  id: string;
  name: string;
  school_id: string;
  created_at: string;
  teacher: { full_name: string; email: string } | null;
  class_members: { id: string; student_name: string; parent: { full_name: string } | null }[];
};

type Tab = "users" | "schools" | "classes";

export function AdminDashboard({
  me,
  schools,
  users,
  classes,
}: {
  me: string;
  schools: School[];
  users: Profile[];
  classes: AdminClass[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(schools.length === 0 ? "schools" : "users");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const schoolById = useMemo(() => new Map(schools.map((s) => [s.id, s])), [schools]);

  async function run(p: PromiseLike<{ error: unknown }>, success: string) {
    setError("");
    setOk("");
    const { error } = await p;
    if (error) return setError(trError(error)), false;
    setOk(success);
    router.refresh();
    return true;
  }

  const stats = [
    { label: "Okul", value: schools.length },
    { label: "Öğretmen", value: users.filter((u) => u.role === "teacher").length },
    { label: "Veli", value: users.filter((u) => u.role === "parent").length },
    { label: "Sınıf", value: classes.length },
  ];

  return (
    <div className="space-y-6">
      <Hero title="Yönetim paneli 🛠️" subtitle="Okulları, kullanıcıları ve sınıfları buradan yönetin." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon="🏫" label="Okul" value={stats[0].value} hue="sky" />
        <StatTile icon="🍎" label="Öğretmen" value={stats[1].value} hue="accent" />
        <StatTile icon="👨‍👩‍👧" label="Veli" value={stats[2].value} hue="mint" />
        <StatTile icon="🎒" label="Sınıf" value={stats[3].value} hue="primary" />
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl bg-surface-3 p-1">
        {(
          [
            ["users", "Kullanıcılar"],
            ["schools", "Okullar"],
            ["classes", "Sınıflar"],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
              tab === k ? "bg-surface text-primary-ink shadow-[0_2px_0_0_var(--color-line)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {error && <Alert>{error}</Alert>}
      {ok && <Alert kind="success">{ok}</Alert>}

      {tab === "users" && (
        <UsersTab me={me} users={users} schoolById={schoolById} run={run} />
      )}
      {tab === "schools" && <SchoolsTab schools={schools} users={users} classes={classes} run={run} />}
      {tab === "classes" && <ClassesTab classes={classes} schoolById={schoolById} run={run} />}
    </div>
  );
}

type Run = (p: PromiseLike<{ error: unknown }>, success: string) => Promise<boolean>;

/* ------------------------------ KULLANICILAR ------------------------------ */
function UsersTab({
  me,
  users,
  schoolById,
  run,
}: {
  me: string;
  users: Profile[];
  schoolById: Map<string, School>;
  run: Run;
}) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | Role>("");

  const list = users.filter((u) => {
    if (role && u.role !== role) return false;
    const s = q.trim().toLocaleLowerCase("tr");
    if (!s) return true;
    return [u.full_name, u.email, u.student_name ?? "", schoolById.get(u.school_id ?? "")?.name ?? ""]
      .join(" ")
      .toLocaleLowerCase("tr")
      .includes(s);
  });

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
        <input className="input" placeholder="Ad, mail, öğrenci veya okul ara…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-44" value={role} onChange={(e) => setRole(e.target.value as Role | "")}>
          <option value="">Tüm roller</option>
          <option value="teacher">Öğretmen</option>
          <option value="parent">Veli</option>
          <option value="admin">Yönetici</option>
        </select>
      </div>
      {list.length === 0 ? (
        <p className="p-6 text-center text-muted">Kullanıcı bulunamadı.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {u.full_name || "(isimsiz)"}
                  {!u.confirmed_at && (
                    <span className="ml-2 rounded-full bg-sun-soft px-2 py-0.5 text-xs font-bold text-sun-ink">
                      Mail doğrulanmadı
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-muted">{u.email}</p>
                <p className="text-sm text-muted">
                  {schoolLabel(u.school_id ? schoolById.get(u.school_id) : null)}
                  {u.student_name ? ` · Öğrenci: ${u.student_name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="input w-36 py-2 text-sm"
                  value={u.role}
                  disabled={u.id === me}
                  onChange={(e) =>
                    run(
                      createClient().from("profiles").update({ role: e.target.value }).eq("id", u.id),
                      `${u.full_name || u.email} artık ${ROLE_LABEL[e.target.value as Role]}.`,
                    )
                  }
                >
                  <option value="teacher">Öğretmen</option>
                  <option value="parent">Veli</option>
                  <option value="admin">Yönetici</option>
                </select>
                <button
                  className="btn-danger px-3 py-2 text-sm"
                  disabled={u.id === me}
                  onClick={() =>
                    confirm(`${u.email} hesabı kalıcı olarak silinsin mi?`) &&
                    run(createClient().rpc("admin_delete_user", { target: u.id }), "Kullanıcı silindi.")
                  }
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* -------------------------------- OKULLAR -------------------------------- */
function SchoolsTab({
  schools,
  users,
  classes,
  run,
}: {
  schools: School[];
  users: Profile[];
  classes: AdminClass[];
  run: Run;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const done = await run(
      createClient().from("schools").insert({ name: name.trim(), city: city.trim() || null }),
      "Okul eklendi.",
    );
    if (done) {
      setName("");
      setCity("");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end sm:p-5">
        <div>
          <label className="label">Okul adı</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Atatürk İlkokulu" />
        </div>
        <div>
          <label className="label">İl / ilçe</label>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Örn. Bursa" />
        </div>
        <button className="btn-primary" disabled={!name.trim()}>Okul ekle</button>
      </form>

      <section className="card overflow-hidden">
        {schools.length === 0 ? (
          <p className="p-6 text-center text-muted">
            Henüz okul yok. Kayıt ekranında okul seçilebilmesi için önce okul ekleyin.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {schools.map((s) => {
              const t = users.filter((u) => u.school_id === s.id && u.role === "teacher").length;
              const p = users.filter((u) => u.school_id === s.id && u.role === "parent").length;
              const c = classes.filter((x) => x.school_id === s.id).length;
              return (
                <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  {editing === s.id ? (
                    <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_10rem]">
                      <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                      <input className="input" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="İl / ilçe" />
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{schoolLabel(s)}</p>
                      <p className="text-sm text-muted">
                        {t} öğretmen · {p} veli · {c} sınıf
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {editing === s.id ? (
                      <>
                        <button
                          className="btn-primary px-3 py-2 text-sm"
                          onClick={async () => {
                            const done = await run(
                              createClient()
                                .from("schools")
                                .update({ name: editName.trim(), city: editCity.trim() || null })
                                .eq("id", s.id),
                              "Okul güncellendi.",
                            );
                            if (done) setEditing(null);
                          }}
                        >
                          Kaydet
                        </button>
                        <button className="btn-ghost px-3 py-2 text-sm" onClick={() => setEditing(null)}>Vazgeç</button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-outline px-3 py-2 text-sm"
                          onClick={() => {
                            setEditing(s.id);
                            setEditName(s.name);
                            setEditCity(s.city ?? "");
                          }}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn-danger px-3 py-2 text-sm"
                          onClick={() =>
                            confirm(
                              `"${s.name}" silinsin mi? Okuldaki ${c} sınıf da silinir; kullanıcı hesapları kalır.`,
                            ) && run(createClient().from("schools").delete().eq("id", s.id), "Okul silindi.")
                          }
                        >
                          Sil
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/* -------------------------------- SINIFLAR ------------------------------- */
function ClassesTab({
  classes,
  schoolById,
  run,
}: {
  classes: AdminClass[];
  schoolById: Map<string, School>;
  run: Run;
}) {
  const [schoolFilter, setSchoolFilter] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = classes.filter((c) => !schoolFilter || c.school_id === schoolFilter);

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line p-4">
        <select className="input sm:w-80" value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="">Tüm okullar</option>
          {[...schoolById.values()].map((s) => (
            <option key={s.id} value={s.id}>{schoolLabel(s)}</option>
          ))}
        </select>
      </div>
      {list.length === 0 ? (
        <p className="p-6 text-center text-muted">Sınıf bulunamadı.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((c) => (
            <li key={c.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  <p className="font-bold">
                    {c.name} <span className="text-sm font-semibold text-muted">{open === c.id ? "▲" : "▼"}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {schoolLabel(schoolById.get(c.school_id))} · {c.teacher?.full_name || "—"} ·{" "}
                    {c.class_members.length} öğrenci
                  </p>
                </button>
                <Link href={`/sinif/${c.id}?sekme=kitap`} className="btn-outline px-3 py-2 text-sm">Sınıfa gir</Link>
                <button
                  className="btn-danger px-3 py-2 text-sm"
                  onClick={() =>
                    confirm(`"${c.name}" sınıfı silinsin mi?`) &&
                    run(createClient().from("classes").delete().eq("id", c.id), "Sınıf silindi.")
                  }
                >
                  Sil
                </button>
              </div>
              {open === c.id && (
                <ul className="mt-3 space-y-1 rounded-xl bg-surface-2 p-3 text-sm">
                  {c.class_members.length === 0 && <li className="text-muted">Katılan veli yok.</li>}
                  {c.class_members.map((m) => (
                    <li key={m.id}>
                      <b>{m.student_name}</b> <span className="text-muted">— Veli: {m.parent?.full_name || "—"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
