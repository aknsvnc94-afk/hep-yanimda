import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentProfile } from "@/lib/auth";
import { schoolLabel } from "@/lib/types";
import type { Book, Member, Reading } from "@/lib/reading-types";
import { ClassView } from "./ClassView";

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sekme?: string; alt?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase, profile } = await getCurrentProfile();
  if (!profile) redirect("/giris");

  const { data: cls } = await supabase
    .from("classes")
    .select("id,name,school_id,teacher_id, teacher:profiles!classes_teacher_id_fkey(full_name), school:schools(name,city)")
    .eq("id", id)
    .maybeSingle();
  if (!cls) notFound();

  const isStaff = profile.role === "admin" || cls.teacher_id === profile.id;

  const [{ data: members }, { data: books }, { data: readings }] = await Promise.all([
    supabase
      .from("class_members")
      .select("id,student_name,parent_id, parent:profiles!class_members_parent_id_fkey(full_name,email)")
      .eq("class_id", id)
      .order("student_name"),
    supabase.from("books").select("id,title,page_count,created_by,created_at").eq("class_id", id).order("title"),
    supabase
      .from("readings")
      .select("id,book_id,member_id,student_name,read_date,status,created_at, book:books(title,page_count)")
      .eq("class_id", id)
      .order("read_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const myMembers = (members ?? []).filter((m) => m.parent_id === profile.id);
  // Veli ise bu sınıfa kayıtlı olmalı
  if (!isStaff && myMembers.length === 0) redirect("/");

  const teacher = cls.teacher as unknown as { full_name: string } | null;
  const school = cls.school as unknown as { name: string; city: string | null } | null;

  return (
    <AppShell profile={profile} schoolName={schoolLabel(school)}>
      <ClassView
        key={`${sp.sekme ?? ""}-${sp.alt ?? ""}`}
        classId={cls.id}
        className={cls.name}
        teacherName={teacher?.full_name ?? ""}
        isStaff={isStaff}
        backHref={profile.role === "admin" ? "/admin" : profile.role === "teacher" ? "/ogretmen" : "/veli"}
        members={(isStaff ? members ?? [] : myMembers) as unknown as Member[]}
        books={(books ?? []) as Book[]}
        readings={(readings ?? []) as unknown as Reading[]}
        initialTab={sp.sekme === "ogrenciler" || sp.sekme === "sinif" ? sp.sekme : "kitap"}
        initialSub={sp.alt}
      />
    </AppShell>
  );
}
