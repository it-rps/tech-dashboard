// src/lib/supabase/server.ts
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => {
          try {
            for (const { name, value, options } of all) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // called from a Server Component — safe to ignore
          }
        },
      },
    },
  );
}
