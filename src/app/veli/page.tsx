import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { schoolLabel } from "@/lib/types";
import { ParentDashboard, type SchoolClass, type Membership } from "./ParentDashboard";

export default async function ParentPage() {
  const { supabase, profile } = await requireRole("parent");

  const [{ data: school }, { data: classes }, { data: memberships }] = await Promise.all([
    supabase.from("schools").select("name,city").eq("id", profile.school_id!).maybeSingle(),
    supabase
      .from("classes")
      .select("id,name, teacher:profiles!classes_teacher_id_fkey(full_name)")
      .eq("school_id", profile.school_id!)
      .order("name"),
    supabase
      .from("class_members")
      .select("id,class_id,student_name")
      .eq("parent_id", profile.id),
  ]);

  return (
    <AppShell profile={profile} schoolName={schoolLabel(school)}>
      <ParentDashboard
        parentId={profile.id}
        name={profile.full_name}
        studentName={profile.student_name ?? ""}
        classes={(classes ?? []) as unknown as SchoolClass[]}
        memberships={(memberships ?? []) as Membership[]}
      />
    </AppShell>
  );
}
