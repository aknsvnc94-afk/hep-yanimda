const pad = (n: number) => String(n).padStart(2, "0");

/** Cihazın yerel tarihini YYYY-MM-DD olarak verir. */
export function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

/** Bu haftanın Pazartesi–Pazar aralığı (cihaz saatine göre). */
export function weekRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toISODate(start), to: toISODate(end) };
}

/** Bu ayın ilk–son günü (cihaz saatine göre). */
export function monthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toISODate(start), to: toISODate(end) };
}

/** 2026-09-28 → 28.09.2026 */
export function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export function monthName(now = new Date()) {
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}
