/** Supabase hata mesajlarını Türkçe'ye çevirir. */
export function trError(err: unknown): string {
  const e = err as { message?: string; code?: string } | null;
  const msg = e?.message ?? String(err ?? "");
  const code = e?.code ?? "";
  const m = msg.toLowerCase();

  if (code === "invalid_credentials" || m.includes("invalid login credentials"))
    return "Mail adresi veya şifre hatalı.";
  if (code === "email_not_confirmed" || m.includes("email not confirmed"))
    return "Mail adresiniz henüz doğrulanmadı.";
  if (code === "user_already_exists" || m.includes("already registered"))
    return "Bu mail adresiyle zaten bir hesap var.";
  if (code === "otp_expired" || (m.includes("token") && (m.includes("expired") || m.includes("invalid"))))
    return "Kod hatalı veya süresi dolmuş.";
  if (code === "weak_password" || m.includes("password should"))
    return "Şifre en az 6 karakter olmalı.";
  if (code === "same_password" || m.includes("different from the old"))
    return "Yeni şifre eskisiyle aynı olamaz.";
  if (code === "over_email_send_rate_limit" || m.includes("rate limit") || m.includes("security purposes"))
    return "Çok sık deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.";
  if (m.includes("database error saving new user"))
    return "Kayıt oluşturulamadı. Okul ve öğrenci bilgilerini kontrol edin.";
  if (m.includes("duplicate key") && m.includes("class_members_student_unique"))
    return "Bu öğrenci zaten bir sınıfa kayıtlı.";
  if (m.includes("duplicate key") && m.includes("classes_teacher_name_unique"))
    return "Bu isimde bir sınıfınız zaten var.";
  if (m.includes("duplicate key") && m.includes("schools_name_city_unique"))
    return "Bu okul zaten ekli.";
  if (m.includes("row-level security")) return "Bu işlem için yetkiniz yok.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.";
  return msg || "Beklenmeyen bir hata oluştu.";
}
