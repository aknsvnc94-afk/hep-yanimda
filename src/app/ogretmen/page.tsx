import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { schoolLabel } from "@/lib/types";
import { TeacherDashboard, type TeacherClass } from "./TeacherDashboard";

export default async function TeacherPage() {
  const { supabase, profile } = await requireRole("teacher");

  const [{ data: school }, { data: classes }, { data: pending }] = await Promise.all([
    supabase.from("schools").select("name,city").eq("id", profile.school_id!).maybeSingle(),
    supabase
      .from("classes")
      .select(
        "id,name,created_at, class_members(id,student_name,created_at, parent:profiles!class_members_parent_id_fkey(full_name,email))",
      )
      .eq("teacher_id", profile.id)
      .order("name"),
    supabase.from("readings").select("class_id").eq("status", "pending"),
  ]);
  const pendingByClass: Record<string, number> = {};
  for (const r of pending ?? []) pendingByClass[r.class_id] = (pendingByClass[r.class_id] ?? 0) + 1;

  return (
    <AppShell profile={profile} schoolName={schoolLabel(school)}>
      <TeacherDashboard
        teacherId={profile.id}
        schoolId={profile.school_id!}
        name={profile.full_name}
        classes={(classes ?? []) as unknown as TeacherClass[]}
        pendingByClass={pendingByClass}
      />
    </AppShell>
  );
}
