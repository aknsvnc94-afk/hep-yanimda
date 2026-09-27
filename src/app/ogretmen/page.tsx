import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { monthRange } from "@/lib/dates";
import { schoolLabel } from "@/lib/types";
import { TeacherDashboard, type ClassStat, type TeacherClass } from "./TeacherDashboard";

export default async function TeacherPage() {
  const { supabase, profile } = await requireRole("teacher");
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const mr = monthRange(now);

  const [{ data: school }, { data: classes }, { data: readings }] = await Promise.all([
    supabase.from("schools").select("name,city").eq("id", profile.school_id!).maybeSingle(),
    supabase.from("classes").select("id,name,created_at, class_members(id)").eq("teacher_id", profile.id).order("name"),
    supabase
      .from("readings")
      .select("class_id,student_name,status,read_date, book:books(page_count)")
      .or(`status.eq.pending,and(status.eq.approved,read_date.gte.${mr.from},read_date.lte.${mr.to})`),
  ]);

  const stats: Record<string, ClassStat> = {};
  for (const c of classes ?? []) stats[c.id] = { pending: 0, books: 0, pages: 0, top: null };
  const perStudent: Record<string, Record<string, number>> = {};
  for (const r of (readings ?? []) as unknown as { class_id: string; student_name: string; status: string; book: { page_count: number } | null }[]) {
    const s = stats[r.class_id];
    if (!s) continue;
    if (r.status === "pending") s.pending++;
    else {
      s.books++;
      s.pages += r.book?.page_count ?? 0;
      const m = (perStudent[r.class_id] ??= {});
      m[r.student_name] = (m[r.student_name] ?? 0) + 1;
    }
  }
  for (const [cid, m] of Object.entries(perStudent)) {
    const best = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    if (best) stats[cid].top = { name: best[0], books: best[1] };
  }

  return (
    <AppShell profile={profile} schoolName={schoolLabel(school)}>
      <TeacherDashboard
        teacherId={profile.id}
        schoolId={profile.school_id!}
        name={profile.full_name}
        classes={(classes ?? []) as unknown as TeacherClass[]}
        stats={stats}
      />
    </AppShell>
  );
}
