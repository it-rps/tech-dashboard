"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "./_lib/schema";
import type { z } from "zod";

export async function login(raw: z.infer<typeof loginSchema>) {
  const { error } = loginSchema.safeParse(raw);
  if (error) return { error: error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error: signupError } = await supabase.auth.signInWithPassword({
    email: raw.email,
    password: raw.password,
  });

  if (signupError) return { error: signupError.message };

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function register(raw: z.infer<typeof registerSchema>) {
  const { error } = registerSchema.safeParse(raw);
  if (error) return { error: error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { error: signupError } = await supabase.auth.signUp({
    email: raw.email,
    password: raw.password,
    options: { data: { full_name: raw.fullName } },
  });

  if (signupError) return { error: signupError.message };

  revalidatePath("/auth/v1/login");
  redirect("/auth/v1/login?registered=1");
}
