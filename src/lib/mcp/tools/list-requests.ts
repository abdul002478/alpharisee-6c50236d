import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_requests",
  title: "Listar pedidos de depósito/saque",
  description: "Lista os pedidos de depósito e/ou saque do utilizador autenticado e o seu estado (pendente, aprovado, rejeitado).",
  inputSchema: {
    kind: z.enum(["deposits", "withdrawals", "all"]).optional().describe("Que pedidos listar. Padrão: all."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const which = kind ?? "all";
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;
    const result: { deposits?: unknown[]; withdrawals?: unknown[] } = {};

    if (which === "deposits" || which === "all") {
      const { data, error } = await supabase
        .from("deposits")
        .select("id,amount,method,reference,status,admin_note,created_at,reviewed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      result.deposits = data ?? [];
    }
    if (which === "withdrawals" || which === "all") {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("id,amount,fee,net_amount,method,status,admin_note,created_at,reviewed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      result.withdrawals = data ?? [];
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});
