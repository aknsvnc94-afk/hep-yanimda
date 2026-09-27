"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/Alert";
import { CodeInput } from "@/components/CodeInput";
import { PasswordInput } from "@/components/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const mail = email.trim().toLowerCase();
    const { error } = await createClient().auth.resetPasswordForEmail(mail);
    setLoading(false);
    if (error) return setError(trError(error));
    setEmail(mail);
    setStep(2);
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pw.length < 6) return setError("Şifre en az 6 karakter olmalı.");
    if (pw !== pw2) return setError("Şifreler birbiriyle aynı değil.");
    setLoading(true);
    const supabase = createClient();
    const { error: vErr } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
    if (vErr) {
      setLoading(false);
      return setError(trError(vErr));
    }
    const { error: uErr } = await supabase.auth.updateUser({ password: pw });
    if (uErr) {
      setLoading(false);
      return setError(trError(uErr));
    }
    await supabase.auth.signOut();
    router.replace("/giris?sifre=yenilendi");
  }

  return (
    <AuthShell
      title="Şifremi unuttum"
      subtitle={
        step === 1
          ? "Kayıtlı mail adresinizi yazın, size şifre yenileme kodu gönderelim."
          : <><b>{email}</b> adresine gönderilen kodu ve yeni şifrenizi girin.</>
      }
      footer={<Link href="/giris" className="link">Giriş ekranına dön</Link>}
    >
      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div>
            <label className="label" htmlFor="email">Mail adresi</label>
            <input id="email" className="input" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com" />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Gönderiliyor…" : "Kod gönder"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Alert kind="info">Bu adres sistemde kayıtlıysa birkaç dakika içinde kod gelecek.</Alert>
          <div>
            <label className="label">Maile gelen kod</label>
            <CodeInput value={code} onChange={setCode} />
          </div>
          <div>
            <label className="label" htmlFor="pw">Yeni şifre</label>
            <PasswordInput id="pw" required minLength={6} autoComplete="new-password"
              value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pw2">Yeni şifre (tekrar)</label>
            <PasswordInput id="pw2" required minLength={6} autoComplete="new-password"
              value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={loading || code.length < 6}>
            {loading ? "Kaydediliyor…" : "Şifremi yenile"}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={() => { setStep(1); setCode(""); }}>
            Farklı mail adresi / kodu tekrar gönder
          </button>
        </form>
      )}
    </AuthShell>
  );
}
