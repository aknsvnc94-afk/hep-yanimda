import { redirect } from "next/navigation";
import { VerifyForm } from "./VerifyForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  if (!email) redirect("/kayit");
  return <VerifyForm email={email} />;
}
