// Cron daily: credit yields for d30/d365 (per day), and final payout for completed d5
import { getAdminClient, ok } from "../_shared/utils.ts";

Deno.serve(async (_req) => {
  const admin = getAdminClient();
  const now = new Date();
  const today = now.toISOString().slice(0,10);

  // Active investments
  const { data: invs } = await admin.from("investments").select("*").eq("status", "active");
  let credited = 0, completed = 0;

  for (const inv of invs || []) {
    const endDate = new Date(inv.end_date);
    const isCompleted = today >= inv.end_date;

    if (inv.category === "d5") {
      // Pay the full total only after end date
      if (isCompleted) {
        const totalReturn = Number(inv.amount) * (Number(inv.daily_yield_pct)/100) * Number(inv.duration_days);
        const totalPayout = Number(inv.amount) + 0; // capital not returned per spec? Spec says "valor total produzidos" -> only profits. We'll credit only profit.
        const profit = Number(inv.amount) * (Number(inv.daily_yield_pct)/100) * Number(inv.duration_days);
        const { data: prof } = await admin.from("profiles").select("balance").eq("id", inv.user_id).maybeSingle();
        const newBal = Number(prof!.balance) + profit;
        await admin.from("profiles").update({ balance: newBal }).eq("id", inv.user_id);
        await admin.from("investments").update({ status: "completed", total_credited: profit, last_credited_date: today }).eq("id", inv.id);
        await admin.from("transactions").insert({
          user_id: inv.user_id, type: "final_payout", amount: profit,
          balance_after: newBal, description: `Pagamento final: ${inv.product_name}`, ref_id: inv.id,
        });
        completed++;
      }
    } else {
      // d30 / d365: credit one day if not credited today and within range
      if (inv.last_credited_date === today) continue;
      if (today < inv.start_date) continue;
      const daily = Number(inv.amount) * (Number(inv.daily_yield_pct)/100);
      const { data: prof } = await admin.from("profiles").select("balance").eq("id", inv.user_id).maybeSingle();
      const newBal = Number(prof!.balance) + daily;
      await admin.from("profiles").update({ balance: newBal }).eq("id", inv.user_id);
      await admin.from("transactions").insert({
        user_id: inv.user_id, type: "yield", amount: daily,
        balance_after: newBal, description: `Rendimento diário: ${inv.product_name}`, ref_id: inv.id,
      });
      const newTotal = Number(inv.total_credited) + daily;
      const updates: Record<string, unknown> = { last_credited_date: today, total_credited: newTotal };
      if (today >= inv.end_date) updates.status = "completed";
      await admin.from("investments").update(updates).eq("id", inv.id);
      credited++;
      if (today >= inv.end_date) completed++;
    }
  }

  return ok({ credited, completed, today });
});
