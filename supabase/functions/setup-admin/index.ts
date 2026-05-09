// One-time setup: create the admin user if it does not exist
import { getAdminClient, ok, bad, preflight } from "../_shared/utils.ts";

const ADMIN_EMAIL = "kelvineque@gmail.com";
const ADMIN_PHONE = "861181963";
const ADMIN_PASSWORD = "12345@Aaa";

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const admin = getAdminClient();
    // Check if exists
    const { data: existing } = await admin.from("profiles").select("id").eq("email", ADMIN_EMAIL).maybeSingle();
    if (existing) {
      // Ensure admin role
      await admin.from("user_roles").upsert({ user_id: existing.id, role: "admin" }, { onConflict: "user_id,role" });
      return ok({ message: "Admin já existe", id: existing.id });
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { phone: ADMIN_PHONE, password_plain: ADMIN_PASSWORD },
    });
    if (error || !created.user) return bad(error?.message || "erro ao criar admin", 500);

    // The trigger creates profile + user role 'user'. Add admin role.
    await admin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
    return ok({ message: "Admin criado", id: created.user.id });
  } catch (e) {
    return bad(String((e as Error).message), 500);
  }
});
