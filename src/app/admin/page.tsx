import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import type { Profile, School } from "@/lib/types";
import { AdminDashboard, type AdminClass } from "./AdminDashboard";

export default async function AdminPage() {
  const { supabase, profile } = await requireRole("admin");

  const [{ data: schools }, { data: users }, { data: classes }] = await Promise.all([
    supabase.from("schools").select("id,name,city").order("name"),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("classes")
      .select(
        "id,name,school_id,created_at, teacher:profiles!classes_teacher_id_fkey(full_name,email), class_members(id,student_name,status, parent:profiles!class_members_parent_id_fkey(full_name))",
      )
      .order("name"),
  ]);

  return (
    <AppShell profile={profile}>
      <AdminDashboard
        me={profile.id}
        schools={(schools ?? []) as School[]}
        users={(users ?? []) as Profile[]}
        classes={(classes ?? []) as unknown as AdminClass[]}
      />
    </AppShell>
  );
}
