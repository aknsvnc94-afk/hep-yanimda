"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/Alert";
import { PasswordInput } from "@/components/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";

export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const mail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
    if (error) {
      setLoading(false);
      if (error.code === "email_not_confirmed") {
        // Doğrulanmamış hesap: yeni kod gönder ve doğrulama ekranına yönlendir
        await supabase.auth.resend({ type: "signup", email: mail });
        router.push(`/dogrula?email=${encodeURIComponent(mail)}`);
        return;
      }
      setError(trError(error));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Giriş yap"
      subtitle="Mail adresiniz ve şifrenizle devam edin."
      footer={
        <>
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="link">
            Kayıt olun
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {notice && <Alert kind="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}
        <div>
          <label className="label" htmlFor="email">Mail adresi</label>
          <input id="email" className="input" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">Şifre</label>
            <Link href="/sifremi-unuttum" className="mb-1 text-sm font-semibold text-brand-600 hover:underline">
              Şifremi unuttum
            </Link>
          </div>
          <PasswordInput id="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </AuthShell>
  );
}
