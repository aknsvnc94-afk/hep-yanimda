import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Game";
import { LogoutButton } from "@/components/LogoutButton";
import { PushToggle } from "@/components/Notifications";
import { getCurrentProfile } from "@/lib/auth";
import { ROLE_LABEL, schoolLabel } from "@/lib/types";

export default async function ProfilePage() {
  const { supabase, profile } = await getCurrentProfile();
  if (!profile) redirect("/giris");

  const [{ data: school }, { data: approvedReadings }] = await Promise.all([
    profile.school_id
      ? supabase.from("schools").select("name,city").eq("id", profile.school_id).maybeSingle()
      : Promise.resolve({ data: null }),
    profile.role === "parent"
      ? supabase.from("readings").select("id, book:books(page_count)").eq("parent_id", profile.id).eq("status", "approved")
      : Promise.resolve({ data: null }),
  ]);

  const rows: [string, string][] = [
    ["Mail", profile.email],
    ["Rol", ROLE_LABEL[profile.role]],
    ["Okul", schoolLabel(school)],
  ];
  if (profile.role === "parent") rows.push(["Öğrenci", profile.student_name ?? "—"]);

  return (
    <AppShell profile={profile} schoolName={schoolLabel(school)}>
      <div className="mx-auto max-w-lg space-y-5">
        <section className="card flex flex-col items-center gap-2 p-6 text-center">
          <Avatar name={profile.full_name || profile.email} size="xl" />
          <h1 className="mt-1 text-2xl font-black text-ink">{profile.full_name || "İsimsiz"}</h1>
          <span className="chip bg-primary-soft text-primary-ink">{ROLE_LABEL[profile.role]}</span>
        </section>

        {profile.role === "parent" && approvedReadings && (
          <section className="card grid grid-cols-2 gap-3 p-5 text-center">
            <p className="col-span-2 text-left text-sm font-bold text-muted">📚 {profile.student_name} — toplam (onaylı)</p>
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="text-2xl font-black tabular-nums text-ink">
                {(approvedReadings as unknown as { book: { page_count: number } | null }[])
                  .reduce((n, r) => n + (r.book?.page_count ?? 0), 0)
                  .toLocaleString("tr-TR")}
              </p>
              <p className="text-xs font-bold text-muted">sayfa</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="text-2xl font-black tabular-nums text-ink">{approvedReadings.length}</p>
              <p className="text-xs font-bold text-muted">kitap</p>
            </div>
          </section>
        )}

        <section className="card divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="text-sm font-bold text-muted">{k}</span>
              <span className="truncate text-right font-bold text-ink">{v}</span>
            </div>
          ))}
        </section>

        <PushToggle userId={profile.id} />

        <section className="card space-y-2 p-5">
          <h2 className="font-black text-ink">📱 Telefona uygulama olarak ekle</h2>
          <p className="text-sm text-ink-2">
            <b>iPhone:</b> Safari’de alttaki <b>Paylaş</b> simgesi → <b>Ana Ekrana Ekle</b>.
          </p>
          <p className="text-sm text-ink-2">
            <b>Android:</b> Chrome’da sağ üstteki <b>⋮</b> menü → <b>Uygulamayı yükle</b> (veya Ana ekrana ekle).
          </p>
          <p className="text-xs text-muted">Karanlık mod telefonunuzun tema ayarına göre otomatik açılır.</p>
        </section>

        <LogoutButton className="btn-danger w-full" />
      </div>
    </AppShell>
  );
}
