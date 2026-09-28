"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type Notif = { id: string; type: string; title: string; body: string; url: string; read_at: string | null; created_at: string };

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "az önce";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export function NotificationList({ userId, items }: { userId: string; items: Notif[] }) {
  const router = useRouter();
  const unread = items.filter((n) => !n.read_at).length;

  // Sayfa açılınca hepsi okundu sayılır
  useEffect(() => {
    if (!unread) return;
    const t = setTimeout(() => {
      createClient()
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null)
        .then(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [unread, userId]);

  async function clearAll() {
    if (!confirm("Tüm bildirimler silinsin mi?")) return;
    await createClient().from("notifications").delete().eq("user_id", userId);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <span className="text-5xl" aria-hidden>🔕</span>
        <p className="font-black text-ink">Henüz bildirim yok</p>
        <p className="text-sm text-ink-2">Onaylar ve yeni kayıtlar burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="card divide-y divide-line overflow-hidden">
        {items.map((n) => (
          <li key={n.id}>
            <Link href={n.url || "/"} className={`flex gap-3 px-4 py-3.5 hover:bg-surface-2 ${n.read_at ? "" : "bg-primary-soft/60"}`}>
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: n.read_at ? "transparent" : "var(--color-accent)" }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-black text-ink">{n.title}</p>
                <p className="text-sm text-ink-2">{n.body}</p>
                <p className="mt-0.5 text-xs font-bold text-muted">{ago(n.created_at)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="text-center">
        <button className="text-xs font-bold text-muted hover:text-danger-ink" onClick={clearAll}>Tümünü sil</button>
      </div>
    </div>
  );
}
