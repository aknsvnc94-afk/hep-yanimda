"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "btn-ghost px-3 py-2 text-sm" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={async () => {
        const supabase = createClient();
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          const sub = await reg?.pushManager.getSubscription();
          if (sub) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            await sub.unsubscribe();
          }
        } catch {}
        await supabase.auth.signOut();
        router.replace("/giris");
        router.refresh();
      }}
    >
      Çıkış yap
    </button>
  );
}
