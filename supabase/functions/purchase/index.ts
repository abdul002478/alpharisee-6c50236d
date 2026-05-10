import { preflight, requireUser, getAdminClient, ok, bad } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const { user } = await requireUser(req);
    const { product_id } = await req.json();
    const admin = getAdminClient();

    const { data: product } = await admin.from("products").select("*").eq("id", product_id).eq("active", true).maybeSingle();
    if (!product) return bad("Produto não encontrado");

    const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!profile) return bad("Perfil não encontrado");
    if (Number(profile.balance) < Number(product.price)) return bad("Saldo insuficiente");

    if (product.category === "d5") {
      const { data: longInv } = await admin.from("investments")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("category", ["d30", "d365"])
        .limit(1);
      if (!longInv || longInv.length === 0) {
        return bad("Não permitido. Compre primeiro um produto de 30 ou 365 dias.");
      }
    }

    const newBalance = Number(profile.balance) - Number(product.price);
    const startDate = new Date();
    const endDate = new Date(startDate); endDate.setDate(endDate.getDate() + product.duration_days);
    const startStr = startDate.toISOString().slice(0,10);
    const endStr = endDate.toISOString().slice(0,10);

    // Update balance
    await admin.from("profiles").update({ balance: newBalance, has_made_first_purchase: true }).eq("id", user.id);

    // Create investment
    const { data: inv } = await admin.from("investments").insert({
      user_id: user.id,
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      amount: product.price,
      daily_yield_pct: product.daily_yield_pct,
      duration_days: product.duration_days,
      start_date: startStr,
      end_date: endStr,
    }).select().single();

    await admin.from("transactions").insert({
      user_id: user.id, type: "purchase", amount: -Number(product.price),
      balance_after: newBalance, description: `Compra: ${product.name}`, ref_id: inv.id,
    });

    // Invite bonus on first purchase
    if (!profile.has_made_first_purchase && profile.invited_by) {
      const bonus = Number(product.price) * 0.18;
      const { data: inviter } = await admin.from("profiles").select("*").eq("id", profile.invited_by).maybeSingle();
      if (inviter) {
        const newBal = Number(inviter.balance) + bonus;
        await admin.from("profiles").update({
          balance: newBal,
          spin_chances: Number(inviter.spin_chances) + 1,
        }).eq("id", inviter.id);
        await admin.from("transactions").insert({
          user_id: inviter.id, type: "invite_bonus", amount: bonus,
          balance_after: newBal, description: `Bónus de convite (18%) — ${profile.phone}`,
        });
      }
    }

    return ok({ success: true, investment_id: inv.id });
  } catch (e) {
    if (e instanceof Response) return e;
    return bad(String((e as Error).message), 500);
  }
});
