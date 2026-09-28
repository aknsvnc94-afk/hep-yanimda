import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PushToggle } from "@/components/Notifications";
import { getCurrentProfile } from "@/lib/auth";
import { NotificationList, type Notif } from "./NotificationList";

export default async function NotificationsPage() {
  const { supabase, profile } = await getCurrentProfile();
  if (!profile) redirect("/giris");
  const { data } = await supabase
    .from("notifications")
    .select("id,type,title,body,url,read_at,created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-black text-ink">🔔 Bildirimler</h1>
        <PushToggle userId={profile.id} />
        <NotificationList userId={profile.id} items={(data ?? []) as Notif[]} />
      </div>
    </AppShell>
  );
}
