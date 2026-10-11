import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

type Sub = { endpoint: string; p256dh: string; auth: string };
type Payload = { title: string; body: string; url: string; tag?: string; subscriptions: Sub[] };

/**
 * Veritabanı yeni bildirim oluşturduğunda buraya istek atar (03-bildirimler.sql).
 * Telefonlara Web Push gönderir; süresi dolmuş abonelikleri siler.
 */
export async function POST(req: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!secret || !pub || !priv) return Response.json({ error: "not configured" }, { status: 503 });
  if (req.headers.get("x-push-secret") !== secret) return Response.json({ error: "unauthorized" }, { status: 401 });

  const data = (await req.json()) as Payload;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://hepyanimda.com.tr", pub, priv);

  const message = JSON.stringify({ title: data.title, body: data.body, url: data.url, tag: data.tag });
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    (data.subscriptions ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, message, {
          TTL: 60 * 60 * 24,
          urgency: "high",
        });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );

  if (dead.length) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    await Promise.all(dead.map((endpoint) => supabase.rpc("remove_push_subscription", { p_endpoint: endpoint, p_secret: secret })));
  }

  return Response.json({ sent, removed: dead.length });
}
