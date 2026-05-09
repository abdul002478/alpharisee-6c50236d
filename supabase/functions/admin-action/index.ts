import { preflight, requireAdmin, ok, bad } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const { user, admin } = await requireAdmin(req);
    const { action, payload } = await req.json();

    switch (action) {
      case "approve_deposit": {
        const { id } = payload;
        const { data: dep } = await admin.from("deposits").select("*").eq("id", id).maybeSingle();
        if (!dep || dep.status !== "pending") return bad("Depósito inválido");
        const { data: prof } = await admin.from("profiles").select("balance").eq("id", dep.user_id).maybeSingle();
        const newBal = Number(prof!.balance) + Number(dep.amount);
        await admin.from("profiles").update({ balance: newBal }).eq("id", dep.user_id);
        await admin.from("deposits").update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id);
        await admin.from("transactions").insert({
          user_id: dep.user_id, type: "deposit", amount: Number(dep.amount),
          balance_after: newBal, description: `Depósito aprovado (${dep.method})`, ref_id: id,
        });
        return ok({ success: true });
      }
      case "reject_deposit": {
        const { id, note } = payload;
        await admin.from("deposits").update({ status: "rejected", admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id);
        return ok({ success: true });
      }
      case "approve_withdrawal": {
        const { id } = payload;
        // balance already deducted at request time
        await admin.from("withdrawals").update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id);
        return ok({ success: true });
      }
      case "reject_withdrawal": {
        const { id, note } = payload;
        const { data: w } = await admin.from("withdrawals").select("*").eq("id", id).maybeSingle();
        if (!w || w.status !== "pending") return bad("Saque inválido");
        // refund
        const { data: prof } = await admin.from("profiles").select("balance").eq("id", w.user_id).maybeSingle();
        const newBal = Number(prof!.balance) + Number(w.amount);
        await admin.from("profiles").update({ balance: newBal }).eq("id", w.user_id);
        await admin.from("withdrawals").update({ status: "rejected", admin_note: note, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", id);
        await admin.from("transactions").insert({
          user_id: w.user_id, type: "admin_adjust", amount: Number(w.amount),
          balance_after: newBal, description: `Reembolso de saque rejeitado: ${note || ""}`, ref_id: id,
        });
        return ok({ success: true });
      }
      case "update_user": {
        const { user_id, balance, password, phone, email } = payload;
        const updates: Record<string, unknown> = {};
        if (balance !== undefined) updates.balance = balance;
        if (phone) updates.phone = phone;
        if (email) updates.email = email;
        if (password) {
          updates.password_plain = password;
          await admin.auth.admin.updateUserById(user_id, { password });
        }
        if (email) await admin.auth.admin.updateUserById(user_id, { email });
        if (Object.keys(updates).length) await admin.from("profiles").update(updates).eq("id", user_id);
        return ok({ success: true });
      }
      case "list_users": {
        const { data } = await admin.from("profiles").select("*").order("created_at", { ascending: false });
        return ok({ users: data });
      }
      case "list_deposits": {
        const { data } = await admin.from("deposits").select("*, profiles!inner(phone,email)").order("created_at", { ascending: false }).limit(200);
        return ok({ deposits: data });
      }
      case "list_withdrawals": {
        const { data } = await admin.from("withdrawals").select("*, profiles!inner(phone,email)").order("created_at", { ascending: false }).limit(200);
        return ok({ withdrawals: data });
      }
      default: return bad("Ação inválida");
    }
  } catch (e) {
    if (e instanceof Response) return e;
    return bad(String((e as Error).message), 500);
  }
});
