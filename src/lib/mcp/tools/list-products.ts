import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "Listar produtos",
  description: "Lista os produtos de investimento disponíveis na plataforma (preço, rendimento diário e duração).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = supabaseAnon();
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,daily_yield_pct,duration_days,category,active")
      .eq("active", true)
      .order("display_order");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
