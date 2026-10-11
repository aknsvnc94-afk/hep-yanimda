"use client";

export type TabItem<K extends string> = { key: K; label: string; icon?: string; badge?: number };

export function Tabs<K extends string>({
  items,
  value,
  onChange,
  variant = "primary",
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (k: K) => void;
  variant?: "primary" | "secondary";
}) {
  const Badge = ({ n }: { n?: number }) =>
    n ? <span className="animate-pop rounded-full bg-accent px-1.5 text-[11px] font-black leading-5 text-white">{n}</span> : null;

  if (variant === "secondary") {
    return (
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {items.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={value === t.key}
            onClick={() => onChange(t.key)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-extrabold transition ${
              value === t.key
                ? "bg-ink text-surface shadow-sm"
                : "bg-surface-2 text-ink-2 ring-1 ring-line hover:bg-surface-3"
            }`}
          >
            {t.icon && <span aria-hidden>{t.icon}</span>}
            {t.label}
            <Badge n={t.badge} />
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl bg-surface-3 p-1" role="tablist">
      {items.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
            value === t.key ? "bg-surface text-primary-ink shadow-[0_2px_0_0_var(--color-line)] ring-2 ring-primary/40" : "text-ink-2 hover:text-ink"
          }`}
        >
          {t.icon && <span aria-hidden>{t.icon}</span>}
          {t.label}
          <Badge n={t.badge} />
        </button>
      ))}
    </div>
  );
}
