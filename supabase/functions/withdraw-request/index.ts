import { preflight, requireUser, getAdminClient, ok, bad } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const { user } = await requireUser(req);
    const { amount, method, account_number, account_name } = await req.json();
    if (!amount || amount < 150) return bad("Saque mínimo é 150 MT");
    if (!["emola","mpesa"].includes(method)) return bad("Método inválido");
    if (!account_number || !account_name) return bad("Dados da conta obrigatórios");

    const admin = getAdminClient();

    // Need active investment
    const { data: inv } = await admin.from("investments").select("id").eq("user_id", user.id).eq("status", "active").limit(1);
    if (!inv?.length) return bad("Precisa de pelo menos um produto ativo para sacar");

    const { data: profile } = await admin.from("profiles").select("balance").eq("id", user.id).maybeSingle();
    if (!profile || Number(profile.balance) < amount) return bad("Saldo insuficiente");

    const fee = amount * 0.05;
    const net = amount - fee;
    const newBalance = Number(profile.balance) - amount;

    // Hold balance now (deduct on request)
    await admin.from("profiles").update({ balance: newBalance }).eq("id", user.id);
    const { data: w } = await admin.from("withdrawals").insert({
      user_id: user.id, amount, fee, net_amount: net, method, account_number, account_name,
    }).select().single();
    await admin.from("transactions").insert({
      user_id: user.id, type: "withdrawal", amount: -amount,
      balance_after: newBalance, description: `Saque solicitado (taxa 5%)`, ref_id: w.id,
    });
    return ok({ success: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return bad(String((e as Error).message), 500);
  }
});
