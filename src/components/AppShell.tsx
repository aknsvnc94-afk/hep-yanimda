import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type Profile } from "@/lib/types";
import { Avatar } from "./Game";
import { LogoMark } from "./Logo";
import { BottomNav, TopNav, type NavItem } from "./NavLinks";

async function navFor(profile: Profile): Promise<NavItem[]> {
  const supabase = await createClient();
  const profil: NavItem = { href: "/profil", label: "Profil", icon: "👤" };

  if (profile.role === "parent") {
    const { data } = await supabase.from("class_members").select("class_id").eq("parent_id", profile.id).limit(1);
    const cid = data?.[0]?.class_id;
    if (!cid) return [{ href: "/veli", label: "Ana Sayfa", icon: "🏠" }, profil];
    return [
      { href: "/veli", label: "Ana Sayfa", icon: "🏠" },
      { href: `/sinif/${cid}?sekme=kitap&alt=giris`, label: "Kitap Gir", icon: "+", primary: true },
      { href: `/sinif/${cid}?sekme=kitap&alt=kitaplar`, label: "Kitaplık", icon: "📚" },
      profil,
    ];
  }

  if (profile.role === "teacher") {
    const [{ data: classes }, { data: pending }] = await Promise.all([
      supabase.from("classes").select("id").eq("teacher_id", profile.id).order("name"),
      supabase.from("readings").select("class_id").eq("status", "pending"),
    ]);
    const first = classes?.[0]?.id;
    const items: NavItem[] = [{ href: "/ogretmen", label: "Sınıflarım", icon: "🏠" }];
    if (first) {
      const pendingClass = pending?.[0]?.class_id ?? first;
      items.push(
        { href: `/sinif/${pendingClass}?sekme=kitap&alt=giris`, label: "Onaylar", icon: "✅", badge: pending?.length ?? 0 },
        { href: `/sinif/${first}?sekme=kitap&alt=rapor`, label: "Rapor", icon: "📊" },
      );
    }
    items.push(profil);
    return items;
  }

  return [{ href: "/admin", label: "Yönetim", icon: "🛠️" }, profil];
}

export async function AppShell({
  profile,
  schoolName,
  children,
}: {
  profile: Profile;
  schoolName?: string;
  children: React.ReactNode;
}) {
  const items = await navFor(profile);
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <LogoMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-black leading-tight text-ink">Hep Yanımda</p>
              <p className="truncate text-xs font-semibold text-muted">
                {ROLE_LABEL[profile.role]}
                {schoolName && schoolName !== "—" ? ` · ${schoolName}` : ""}
              </p>
            </div>
          </Link>
          <Suspense>
            <TopNav items={items.filter((i) => i.href !== "/profil")} />
          </Suspense>
          <Link href="/profil" className="flex items-center gap-2 rounded-full p-1 pr-1 hover:bg-surface-3 md:pr-3" aria-label="Profil">
            <Avatar name={profile.full_name || profile.email} size="sm" />
            <span className="hidden max-w-32 truncate text-sm font-bold text-ink-2 md:inline">
              {profile.full_name.split(" ")[0] || "Profil"}
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:pt-7 md:pb-12">{children}</main>
      <Suspense>
        <BottomNav items={items} />
      </Suspense>
    </div>
  );
}
