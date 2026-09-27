import { LoginForm } from "./LoginForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ sifre?: string; dogrulandi?: string }> }) {
  const sp = await searchParams;
  const notice =
    sp.sifre === "yenilendi"
      ? "Şifreniz yenilendi. Yeni şifrenizle giriş yapabilirsiniz."
      : undefined;
  return <LoginForm notice={notice} />;
}
