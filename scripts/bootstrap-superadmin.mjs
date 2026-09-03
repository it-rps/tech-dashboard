// scripts/bootstrap-superadmin.mjs
// One-off: create sayz.1ost@gmail.com as superadmin. Run: node scripts/bootstrap-superadmin.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const email = "sayz.1ost@gmail.com";
const password = "Lolipop-11";

// 1. Create or list user
const { data: list } = await admin.auth.admin.listUsers();
let user = list.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Sayz (Superadmin)" },
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  user = data.user;
  console.log("Created auth user:", user.id);
} else {
  // Update password to match
  await admin.auth.admin.updateUserById(user.id, { password });
  console.log("User exists, password reset:", user.id);
}

// 2. Trigger may have already created profile; upsert to owner + active
const { error: upsertErr } = await admin
  .from("profiles")
  .upsert({ id: user.id, full_name: "Sayz (Superadmin)", role: "owner", is_active: true });
if (upsertErr) {
  console.error("profile upsert failed:", upsertErr.message);
  process.exit(1);
}
console.log("Profile set to owner/active:", user.id);
