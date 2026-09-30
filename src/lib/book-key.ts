/** Kitap adını karşılaştırma için sadeleştirir (veritabanındaki book_key ile aynı kural). */
export function bookKey(t: string) {
  const from = "İIıŞşĞğÜüÖöÇçÂâÎîÛû";
  const to = "iiissgguuooccaaiiuu";
  let s = "";
  for (const ch of t ?? "") {
    const i = from.indexOf(ch);
    s += i >= 0 ? to[i] : ch;
  }
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
