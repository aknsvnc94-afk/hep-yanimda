import { HUE_CLASSES, hueFor, initials, levelFor, type Hue } from "@/lib/game";

export function Avatar({ name, size = "md", hue }: { name: string; size?: "sm" | "md" | "lg" | "xl"; hue?: Hue }) {
  const h = HUE_CLASSES[hue ?? hueFor(name)];
  const s = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg", xl: "h-20 w-20 text-2xl" }[size];
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-full font-black text-white ${h.bg} ${s}`} aria-hidden>
      {initials(name)}
    </span>
  );
}

/** Dairesel ilerleme halkası */
export function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  color = "var(--color-primary)",
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function StatTile({
  icon,
  label,
  value,
  hue = "primary",
  hint,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  hue?: Hue;
  hint?: string;
}) {
  const h = HUE_CLASSES[hue];
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl ${h.soft}`} aria-hidden>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-muted">{label}</p>
        <p className="text-2xl font-black tabular-nums leading-tight text-ink">{value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/** Öğrencinin seviye rozeti + sonraki seviyeye ilerleme */
export function LevelBadge({ books, compact = false }: { books: number; compact?: boolean }) {
  const lv = levelFor(books);
  if (compact) {
    return (
      <span className="chip bg-sun-soft text-sun-ink" title={`Seviye ${lv.index}: ${lv.name}`}>
        {lv.emoji} {lv.name}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <ProgressRing value={lv.progress} size={72} stroke={8} color="var(--color-sun)">
        <span className="text-3xl">{lv.emoji}</span>
      </ProgressRing>
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted">Seviye {lv.index}</p>
        <p className="text-lg font-black text-ink">{lv.name}</p>
        <p className="text-xs text-ink-2">
          {lv.next ? (
            <>
              <b>{lv.next.name}</b> {lv.next.emoji} için <b>{lv.toNext}</b> kitap daha
            </>
          ) : (
            "En yüksek seviyeye ulaştı! 🎉"
          )}
        </p>
      </div>
    </div>
  );
}

export function SectionTitle({ icon, children, right }: { icon?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-black text-ink">
        {icon && <span aria-hidden>{icon}</span>}
        {children}
      </h2>
      {right}
    </div>
  );
}
