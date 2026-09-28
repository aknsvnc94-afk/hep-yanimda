import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Profile, type Role } from "@/lib/types";

/** Giriş yapan kullanıcının profilini döndürür, yoksa null. */
export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, profile: null as Profile | null };
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle<Profile>();
  return { supabase, profile: data };
}

/** Sayfayı sadece belirtilen role açar; aksi halde doğru sayfaya yönlendirir. */
export async function requireRole(role: Role) {
  const { supabase, profile } = await getCurrentProfile();
  if (!profile) redirect("/giris");
  if (profile.role !== role) redirect(ROLE_HOME[profile.role]);
  return { supabase, profile };
}
