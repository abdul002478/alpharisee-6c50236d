import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function getUserClient(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } }
  );
}

export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

export async function requireUser(req: Request) {
  const sb = getUserClient(req);
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return { user, sb };
}

export async function requireAdmin(req: Request) {
  const { user, sb } = await requireUser(req);
  const admin = getAdminClient();
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
  if (!roles?.some((r: any) => r.role === "admin")) {
    throw new Response(JSON.stringify({ error: "Apenas ADM" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return { user, sb, admin };
}

export function ok(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
export function bad(error: string, status = 400) {
  return new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
export function preflight(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return null;
}
