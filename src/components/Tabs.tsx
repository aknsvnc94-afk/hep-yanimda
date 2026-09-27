"use client";

export type TabItem<K extends string> = { key: K; label: string; badge?: number };

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
  if (variant === "secondary") {
    return (
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {items.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={value === t.key}
            onClick={() => onChange(t.key)}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold transition ${
              value === t.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span className="rounded-full bg-amber-400 px-1.5 text-xs font-extrabold text-slate-900">{t.badge}</span>
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1" role="tablist">
      {items.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition ${
            value === t.key ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t.label}
          {!!t.badge && (
            <span className="rounded-full bg-amber-400 px-1.5 text-xs font-extrabold text-slate-900">{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
