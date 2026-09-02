// src/lib/auth/guard.ts
import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Role = Database["public"]["Enums"]["user_role"];

type Profile = {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/v1/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.is_active) redirect("/auth/v1/login");
  return { user, profile };
}

export async function requireRole(allowed: Role[]) {
  const ctx = await requireUser();
  if (!allowed.includes(ctx.profile.role as Role)) redirect("/dashboard?error=forbidden");
  return ctx;
}

export const canSeeCost = (role: Role) => role === "owner" || role === "manager";