"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/Alert";
import { PasswordInput } from "@/components/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";
import { schoolLabel, type School } from "@/lib/types";

type Kind = "teacher" | "parent";

export default function RegisterPage() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("parent");
  const [schools, setSchools] = useState<School[] | null>(null);
  const [form, setForm] = useState({
    full_name: "", email: "", school_id: "", student_name: "", password: "", password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient()
      .from("schools")
      .select("id,name,city")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError(trError(error));
        setSchools(data ?? []);
      });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) return setError("Şifre en az 6 karakter olmalı.");
    if (form.password !== form.password2) return setError("Şifreler birbiriyle aynı değil.");
    if (!form.school_id) return setError("Lütfen okulunuzu seçin.");
    if (kind === "parent" && !form.student_name.trim()) return setError("Lütfen öğrencinin adını yazın.");

    setLoading(true);
    const email = form.email.trim().toLowerCase();
    const { data, error } = await createClient().auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          role: kind,
          full_name: form.full_name.trim(),
          school_id: form.school_id,
          student_name: kind === "parent" ? form.student_name.trim() : null,
        },
      },
    });
    setLoading(false);
    if (error) return setError(trError(error));
    // Mail zaten kayıtlı ve doğrulanmışsa Supabase boş kimlik listesi döndürür
    if (data.user && data.user.identities?.length === 0) {
      return setError("Bu mail adresiyle zaten bir hesap var. Giriş yapmayı deneyin.");
    }
    // Supabase'de "Confirm email" kapalıysa oturum hemen açılır → direkt panele
    if (data.session) {
      router.replace("/");
      router.refresh();
      return;
    }
    // Mail onayı açıksa kod ekranına
    router.push(`/dogrula?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthShell
      title="Aramıza katıl 👋"
      subtitle="Bilgilerinizi girin, hemen başlayın."
      footer={
        <>
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="link">Giriş yapın</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3" role="tablist">
          {([
            ["parent", "👨‍👩‍👧", "Veliyim", "Öğrencimi takip edeceğim"],
            ["teacher", "🍎", "Öğretmenim", "Sınıfımı yöneteceğim"],
          ] as [Kind, string, string, string][]).map(([k, icon, label, desc]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center transition active:translate-y-[2px] ${
                kind === k
                  ? "border-primary bg-primary-soft shadow-[0_3px_0_0_var(--color-primary)]"
                  : "border-line bg-surface shadow-[0_3px_0_0_var(--color-line)] hover:bg-surface-2"
              }`}
            >
              <span className={`text-3xl ${kind === k ? "animate-pop" : ""}`} aria-hidden>{icon}</span>
              <span className={`font-black ${kind === k ? "text-primary-ink" : "text-ink"}`}>{label}</span>
              <span className="text-[11px] font-semibold leading-tight text-muted">{desc}</span>
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}

        <div>
          <label className="label" htmlFor="full_name">Adınız soyadınız</label>
          <input id="full_name" className="input" required autoComplete="name"
            value={form.full_name} onChange={set("full_name")} />
        </div>
        <div>
          <label className="label" htmlFor="email">Mail adresi</label>
          <input id="email" className="input" type="email" required autoComplete="email"
            value={form.email} onChange={set("email")} placeholder="ornek@mail.com" />
        </div>
        <div>
          <label className="label" htmlFor="school">Okul</label>
          <select id="school" className="input" required value={form.school_id} onChange={set("school_id")}
            disabled={!schools}>
            <option value="">{schools ? "Okulunuzu seçin" : "Okullar yükleniyor…"}</option>
            {schools?.map((s) => (
              <option key={s.id} value={s.id}>{schoolLabel(s)}</option>
            ))}
          </select>
          {schools && schools.length === 0 && (
            <p className="mt-1 text-xs text-muted">Henüz okul eklenmemiş. Lütfen yöneticinizle iletişime geçin.</p>
          )}
        </div>
        {kind === "parent" && (
          <div>
            <label className="label" htmlFor="student">Öğrencinin adı soyadı</label>
            <input id="student" className="input" required
              value={form.student_name} onChange={set("student_name")} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pw">Şifre</label>
            <PasswordInput id="pw" required minLength={6} autoComplete="new-password"
              value={form.password} onChange={set("password")} />
          </div>
          <div>
            <label className="label" htmlFor="pw2">Şifre (tekrar)</label>
            <PasswordInput id="pw2" required minLength={6} autoComplete="new-password"
              value={form.password2} onChange={set("password2")} />
          </div>
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Kaydediliyor…" : "Hadi başlayalım 🚀"}
        </button>
      </form>
    </AuthShell>
  );
}
