/** Oyunlaştırma: sıralamadaki ilk 5 öğrenciye özel unvanlar (sadece onaylı kitaplar sayılır). */

export type RankTitle = { name: string; emoji: string };

export const RANK_TITLES: RankTitle[] = [
  { name: "Kitap Efsanesi", emoji: "👑" },
  { name: "Okuma Şampiyonu", emoji: "🏅" },
  { name: "Kitap Ustası", emoji: "🦉" },
  { name: "Kitap Kaşifi", emoji: "🧭" },
  { name: "Kitap Kurdu", emoji: "🐛" },
];

/** 0 tabanlı sıra → unvan (ilk 5 dışında null) */
export function rankTitle(index: number): RankTitle | null {
  return RANK_TITLES[index] ?? null;
}

/** Sıralama kuralı: önce toplam sayfa, eşitse kitap sayısı, sonra isim. */
export function byPages<T extends { page_count: number; book_count: number; student_name: string }>(a: T, b: T) {
  return b.page_count - a.page_count || b.book_count - a.book_count || a.student_name.localeCompare(b.student_name, "tr");
}

/** Aylık kitap hedefi (değiştirmek için bu sayıyı düzenleyin). */
export const MONTHLY_GOAL = 4;

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
