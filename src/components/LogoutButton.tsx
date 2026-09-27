"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "btn-ghost px-3 py-2 text-sm" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/giris");
        router.refresh();
      }}
    >
      Çıkış yap
    </button>
  );
}
