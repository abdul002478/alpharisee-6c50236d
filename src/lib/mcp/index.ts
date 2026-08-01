import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getAccountTool from "./tools/get-account";
import listProductsTool from "./tools/list-products";
import listInvestmentsTool from "./tools/list-investments";
import listTransactionsTool from "./tools/list-transactions";
import listRequestsTool from "./tools/list-requests";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "investir-rapido-mocambique",
  title: "Investir Rápido Moçambique",
  version: "0.1.0",
  instructions:
    "Ferramentas da plataforma Investir Rápido Moçambique. Use `list_products` para ver os produtos disponíveis, `get_account` para o saldo e dados da conta, `list_investments` para os produtos comprados, `list_transactions` para o histórico financeiro e `list_requests` para pedidos de depósito e saque. Todos os dados são do utilizador autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getAccountTool, listProductsTool, listInvestmentsTool, listTransactionsTool, listRequestsTool],
});
