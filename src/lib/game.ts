/** Oyunlaştırma: seviyeler ve hedefler (sadece onaylı kitaplar sayılır). */

export type Level = { name: string; emoji: string; min: number };

export const LEVELS: Level[] = [
  { name: "Yeni Okur", emoji: "🥚", min: 0 },
  { name: "Kitap Filizi", emoji: "🌱", min: 1 },
  { name: "Kitap Kurdu", emoji: "🐛", min: 3 },
  { name: "Kitap Kaşifi", emoji: "🧭", min: 6 },
  { name: "Kitap Ustası", emoji: "🦉", min: 11 },
  { name: "Okuma Şampiyonu", emoji: "🏅", min: 21 },
  { name: "Kitap Efsanesi", emoji: "👑", min: 35 },
];

/** Aylık kitap hedefi (değiştirmek için bu sayıyı düzenleyin). */
export const MONTHLY_GOAL = 4;

export function levelFor(books: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (books >= LEVELS[k].min) i = k;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (books - cur.min) / (next.min - cur.min) : 1;
  return { ...cur, index: i + 1, next, progress, toNext: next ? next.min - books : 0 };
}

/** Sınıf/öğrenci için sabit renk (isimden türetilir). */
const PALETTE = ["primary", "accent", "mint", "sky", "sun"] as const;
export type Hue = (typeof PALETTE)[number];
export function hueFor(key: string): Hue {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Tailwind'in görebilmesi için sınıf adları açıkça yazılı. */
export const HUE_CLASSES: Record<Hue, { bg: string; soft: string; ink: string; grad: string; shadow: string }> = {
  primary: { bg: "bg-primary", soft: "bg-primary-soft", ink: "text-primary-ink", grad: "from-primary to-[#9b7bff]", shadow: "shadow-[0_4px_0_0_var(--color-primary-700)]" },
  accent: { bg: "bg-accent", soft: "bg-accent-soft", ink: "text-accent-ink", grad: "from-accent to-[#ff9a5c]", shadow: "shadow-[0_4px_0_0_var(--color-accent-700)]" },
  mint: { bg: "bg-mint", soft: "bg-mint-soft", ink: "text-mint-ink", grad: "from-mint to-[#38d9b0]", shadow: "shadow-[0_4px_0_0_var(--color-mint-700)]" },
  sky: { bg: "bg-sky", soft: "bg-sky-soft", ink: "text-sky-ink", grad: "from-sky to-[#5fc8ff]", shadow: "shadow-[0_4px_0_0_var(--color-sky-700)]" },
  sun: { bg: "bg-sun", soft: "bg-sun-soft", ink: "text-sun-ink", grad: "from-sun to-[#ffd966]", shadow: "shadow-[0_4px_0_0_var(--color-sun-700)]" },
};

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr") ?? "")
    .join("") || "?";
}
