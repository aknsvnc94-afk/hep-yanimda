export type Role = "teacher" | "parent" | "admin";

export type School = { id: string; name: string; city: string | null };

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  school_id: string | null;
  student_name: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export const ROLE_LABEL: Record<Role, string> = {
  teacher: "Öğretmen",
  parent: "Veli",
  admin: "Yönetici",
};

export const ROLE_HOME: Record<Role, string> = {
  teacher: "/ogretmen",
  parent: "/veli",
  admin: "/admin",
};

export function schoolLabel(s: Pick<School, "name" | "city"> | null | undefined) {
  if (!s) return "—";
  return s.city ? `${s.name} (${s.city})` : s.name;
}
