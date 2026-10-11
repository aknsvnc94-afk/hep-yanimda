"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Servis çalışanını (telefon bildirimleri için) kaydeder */
export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** Üst menüdeki zil + okunmamış sayısı (30 sn'de bir ve sayfaya dönünce yenilenir) */
export function NotificationBell({ userId, initial }: { userId: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const path = usePathname();

  const refresh = useCallback(async () => {
    const { count } = await createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (typeof count === "number") setCount(count);
  }, [userId]);

  useEffect(() => {
    const t = setInterval(refresh, 30000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  // Bildirimler sayfasındayken sayaç sıfırlanır
  useEffect(() => {
    if (path === "/bildirimler") {
      const t = setTimeout(() => setCount(0), 1500);
      return () => clearTimeout(t);
    }
  }, [path]);

  // Ana ekrana eklenmiş uygulama ikonunda rozet
  useEffect(() => {
    const n = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (count > 0) n.setAppBadge?.(count).catch(() => {});
    else n.clearAppBadge?.().catch(() => {});
  }, [count]);

  return (
    <Link
      href="/bildirimler"
      aria-label={`Bildirimler${count ? `, ${count} okunmamış` : ""}`}
      className="relative grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-surface-3"
    >
      <span aria-hidden className={count ? "inline-block animate-[wiggle_1s_ease-in-out_2]" : ""}>🔔</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 min-w-5 animate-pop rounded-full bg-accent px-1 text-center text-[11px] font-black leading-5 text-white ring-2 ring-surface">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/* ---------------------------- Telefon bildirimleri ---------------------------- */

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type PushState = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on" | "not-configured";

function detect(): PushState {
  if (!VAPID) return "not-configured";
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return ios && !standalone ? "ios-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return "off";
}

export function PushToggle({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = detect();
    if (s !== "off") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(s);
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription() ?? null)
      .then((sub) => setState(sub && Notification.permission === "granted" ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID) }));
      const j = sub.toJSON();
      const supabase = createClient();
      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: j.keys?.p256dh ?? "",
        auth: j.keys?.auth ?? "",
      });
      if (error && error.code !== "23505") throw error;
      setState("on");
      setMsg("Bildirimler açıldı. 🎉");
    } catch {
      setMsg("Bildirimler açılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
      setMsg("");
    } finally {
      setBusy(false);
    }
  }

  const text: Record<PushState, string> = {
    loading: "",
    "not-configured": "Telefon bildirimleri henüz yapılandırılmadı.",
    unsupported: "Bu tarayıcı telefon bildirimlerini desteklemiyor. Uygulama içi bildirimler (🔔) çalışmaya devam eder.",
    "ios-install": "iPhone’da bildirim almak için önce uygulamayı ana ekrana ekleyin (Paylaş → Ana Ekrana Ekle), sonra oradan açıp bu butona dokunun.",
    denied: "Bildirim izni kapalı. Telefonunuzun Ayarlar → Bildirimler bölümünden bu siteye izin verin.",
    off: "Yeni onaylar ve kitap kayıtları telefonunuza bildirim olarak gelsin.",
    on: "Telefon bildirimleri açık ✅",
  };

  if (state === "loading") return null;
  if (compact && (state === "on" || state === "not-configured" || state === "unsupported")) return null;

  return (
    <section className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${compact ? "ring-2 ring-primary/30" : ""}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-2xl" aria-hidden>📲</span>
      <div className="min-w-0 flex-1">
        <p className="font-black text-ink">Telefon bildirimleri</p>
        <p className="text-sm text-ink-2">{msg || text[state]}</p>
      </div>
      {state === "off" && (
        <button className="btn-primary text-sm" onClick={enable} disabled={busy}>
          {busy ? "Açılıyor…" : "🔔 Bildirimleri aç"}
        </button>
      )}
      {state === "on" && !compact && (
        <button className="btn-outline text-sm" onClick={disable} disabled={busy}>Kapat</button>
      )}
    </section>
  );
}
