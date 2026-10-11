import { HUE_CLASSES, hueFor, initials, rankTitle, RANK_TITLES, type Hue } from "@/lib/game";

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

const CHIP_STYLE = [
  "bg-sun-soft text-sun-ink ring-1 ring-sun/50",
  "bg-sky-soft text-sky-ink",
  "bg-accent-soft text-accent-ink",
  "bg-mint-soft text-mint-ink",
  "bg-primary-soft text-primary-ink",
];

/** İlk 5 için unvan etiketi (0 tabanlı sıra). İlk 5 dışında hiçbir şey göstermez. */
export function RankChip({ index, wrap = false }: { index: number; wrap?: boolean }) {
  const t = rankTitle(index);
  if (!t) return null;
  return (
    <span
      className={`chip ${wrap ? "justify-center text-center text-[10px] leading-tight" : "whitespace-nowrap"} ${CHIP_STYLE[index]}`}
      title={`${index + 1}. sıra: ${t.name}`}
    >
      {t.emoji} {t.name}
    </span>
  );
}

/** Velinin kendi öğrencisinin bu ayki unvan kartı */
export function TitleCard({
  index,
  pages,
  books,
  toTop5,
}: {
  index: number; // 0 tabanlı sıra, -1: listede yok
  pages: number;
  books: number;
  toTop5: number; // ilk 5'e girmek için gereken sayfa
}) {
  const t = index >= 0 ? rankTitle(index) : null;
  return (
    <div className="flex items-center gap-4">
      <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-4xl ${t ? "bg-sun-soft" : "bg-surface-3"}`} aria-hidden>
        {t ? t.emoji : "🌱"}
      </div>
      <div className="min-w-0">
        {t ? (
          <>
            <p className="text-xs font-bold text-muted">Sınıfta {index + 1}. sırada</p>
            <p className="text-xl font-black text-ink">{t.name}</p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-muted">{books > 0 ? `Sınıfta ${index + 1}. sırada` : "Bu ay henüz onaylı kitap yok"}</p>
            <p className="text-lg font-black text-ink">İlk 5’e yolculuk 🚀</p>
          </>
        )}
        <p className="text-xs text-ink-2">
          {t
            ? index > 0
              ? <>Bir üst unvan için okumaya devam! <b>{RANK_TITLES[index - 1].emoji} {RANK_TITLES[index - 1].name}</b></>
              : <>Sınıfın zirvesinde! 🎉 <b>{pages.toLocaleString("tr-TR")}</b> sayfa</>
            : toTop5 > 0
              ? <><b>{toTop5.toLocaleString("tr-TR")}</b> sayfa daha okursa <b>🐛 Kitap Kurdu</b> unvanını alabilir.</>
              : <>İlk kitabı kaydedip onaylanınca sıralamaya girer.</>}
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
