import { LogoMark } from "./Logo";
import { LogoutButton } from "./LogoutButton";
import { ROLE_LABEL, type Profile } from "@/lib/types";

export function AppShell({
  profile,
  schoolName,
  children,
}: {
  profile: Profile;
  schoolName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-extrabold leading-tight">Hep Yanımda</p>
              <p className="truncate text-xs text-slate-500">
                {ROLE_LABEL[profile.role]}
                {schoolName ? ` · ${schoolName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-semibold text-slate-700 sm:inline">{profile.full_name || profile.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
