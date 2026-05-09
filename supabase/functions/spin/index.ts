import { preflight, requireUser, getAdminClient, ok, bad } from "../_shared/utils.ts";

// Visual prizes shown on wheel (8 slots), but real outcome is always < 100 MT
const VISUAL_PRIZES = [25, 50, 75, 95, 150, 300, 500, 760];
const REAL_PRIZES = [25, 35, 50, 60, 75, 85, 95, 99]; // always < 100

Deno.serve(async (req) => {
  const pf = preflight(req); if (pf) return pf;
  try {
    const { user } = await requireUser(req);
    const admin = getAdminClient();

    const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!profile) return bad("Perfil não encontrado");
    if (Number(profile.spin_chances) < 1) return bad("Sem chances disponíveis");

    // Pick a real prize (< 100)
    const realPrize = REAL_PRIZES[Math.floor(Math.random() * REAL_PRIZES.length)];

    // Find an index in VISUAL_PRIZES whose displayed value matches a low value, otherwise pick lowest visual
    let visualIndex = VISUAL_PRIZES.findIndex((v) => v === realPrize);
    if (visualIndex === -1) {
      // pick the closest visual prize that is <100 to land on
      const lowIndices = VISUAL_PRIZES.map((v,i) => ({v,i})).filter(x => x.v < 100);
      visualIndex = lowIndices[Math.floor(Math.random() * lowIndices.length)].i;
    }

    const newBalance = Number(profile.balance) + realPrize;
    await admin.from("profiles").update({
      balance: newBalance,
      spin_chances: Number(profile.spin_chances) - 1,
    }).eq("id", user.id);
    await admin.from("transactions").insert({
      user_id: user.id, type: "spin", amount: realPrize,
      balance_after: newBalance, description: `Roleta da Sorte: +${realPrize} MT`,
    });
    await admin.from("spin_history").insert({ user_id: user.id, prize_amount: realPrize });

    return ok({ prize: realPrize, visualIndex, prizes: VISUAL_PRIZES });
  } catch (e) {
    if (e instanceof Response) return e;
    return bad(String((e as Error).message), 500);
  }
});
