"use client";

/** Mail ile gelen doğrulama kodu alanı (sadece rakam). */
export function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="input text-center font-mono text-2xl tracking-[0.5em]"
      inputMode="numeric"
      autoComplete="one-time-code"
      placeholder="••••••"
      maxLength={10}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      required
    />
  );
}
