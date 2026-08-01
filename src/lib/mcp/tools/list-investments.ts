import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_investments",
  title: "Listar investimentos",
  description: "Lista os produtos comprados pelo utilizador autenticado, com estado, rendimento creditado e data de fim.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("investments")
      .select("id,product_name,amount,category,daily_yield_pct,duration_days,start_date,end_date,status,total_credited")
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { investments: data ?? [] },
    };
  },
});
