import { preflight, requireUser, getAdminClient, ok, bad } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const { user } = await requireUser(req);
    const { amount, method, reference, sender_phone, sender_name } = await req.json();
    if (!amount || amount < 400) return bad("Valor mínimo 400 MT");
    if (!["emola","mpesa"].includes(method)) return bad("Método inválido");
    if (!reference) return bad("Referência obrigatória");
    if (!sender_name) return bad("Nome do remetente obrigatório");

    const admin = getAdminClient();
    await admin.from("deposits").insert({
      user_id: user.id, amount, method, reference,
      sender_phone: sender_name ? `${sender_name} - ${sender_phone || ""}` : sender_phone,
    });
    return ok({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return bad(String((e as Error).message), 500);
  }
});
