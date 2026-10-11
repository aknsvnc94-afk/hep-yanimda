"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string; badge?: number; primary?: boolean };

function useIsActive() {
  const path = usePathname();
  const sp = useSearchParams();
  return (href: string) => {
    const u = new URL(href, "http://x");
    if (u.pathname !== path) return false;
    const alt = u.searchParams.get("alt");
    if (!alt) return true;
    return sp.get("alt") === alt;
  };
}

/** Telefonda alttaki uygulama menüsü */
export function BottomNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Ana menü"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2">
        {items.map((it) => {
          const active = isActive(it.href);
          if (it.primary) {
            return (
              <li key={it.href} className="-mt-6">
                <Link href={it.href} className="flex flex-col items-center gap-0.5" aria-label={it.label}>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-accent text-3xl font-black text-white shadow-[0_4px_0_0_var(--color-accent-700)] ring-4 ring-surface active:translate-y-[2px]">
                    {it.icon}
                  </span>
                  <span className="pb-1.5 text-[11px] font-extrabold text-accent-ink">{it.label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-extrabold transition ${
                  active ? "text-primary-ink" : "text-muted"
                }`}
              >
                <span className={`grid h-8 w-12 place-items-center rounded-full text-lg transition ${active ? "bg-primary-soft" : ""}`}>
                  {it.icon}
                </span>
                {it.label}
                {!!it.badge && (
                  <span className="absolute right-[calc(50%-24px)] top-1 rounded-full bg-accent px-1.5 text-[10px] font-black leading-4 text-white">
                    {it.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Masaüstünde üst menü bağlantıları */
export function TopNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Ana menü">
      {items.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-extrabold transition ${
              it.primary
                ? "bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-700)] hover:brightness-105"
                : active
                  ? "bg-primary-soft text-primary-ink"
                  : "text-ink-2 hover:bg-surface-3"
            }`}
          >
            <span aria-hidden>{it.icon}</span>
            {it.label}
            {!!it.badge && <span className="rounded-full bg-accent px-1.5 text-[11px] font-black leading-5 text-white">{it.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
