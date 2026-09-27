"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn-ghost px-3 py-2 text-sm"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/giris");
        router.refresh();
      }}
    >
      Çıkış
    </button>
  );
}
