"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/Alert";
import { CodeInput } from "@/components/CodeInput";
import { createClient } from "@/lib/supabase/client";
import { trError } from "@/lib/errors";

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const { error } = await createClient().auth.verifyOtp({ email, token: code, type: "signup" });
    if (error) {
      setLoading(false);
      return setError(trError(error));
    }
    router.replace("/");
    router.refresh();
  }

  async function resend() {
    setError("");
    setInfo("");
    const { error } = await createClient().auth.resend({ type: "signup", email });
    if (error) return setError(trError(error));
    setInfo("Yeni kod gönderildi.");
    setCooldown(60);
  }

  return (
    <AuthShell
      title="Mail adresinizi doğrulayın"
      subtitle={<><b>{email}</b> adresine bir doğrulama kodu gönderdik. Kodu aşağıya girerek kaydınızı tamamlayın.</>}
      footer={<Link href="/giris" className="link">Giriş ekranına dön</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {info && <Alert kind="success">{info}</Alert>}
        <div>
          <label className="label">Doğrulama kodu</label>
          <CodeInput value={code} onChange={setCode} />
          <p className="mt-1.5 text-xs text-muted">Mail gelmediyse gereksiz (spam) klasörünü kontrol edin.</p>
        </div>
        <button className="btn-primary w-full" disabled={loading || code.length < 6}>
          {loading ? "Doğrulanıyor…" : "Kaydı tamamla"}
        </button>
        <button type="button" className="btn-ghost w-full" onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Kodu tekrar gönder (${cooldown} sn)` : "Kodu tekrar gönder"}
        </button>
      </form>
    </AuthShell>
  );
}
