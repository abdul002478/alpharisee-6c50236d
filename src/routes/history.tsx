import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/history")({ component: History });

interface Tx { id:string; type:string; amount:number; balance_after:number; description:string; created_at:string; }

const TYPE_LABEL: Record<string,string> = {
  deposit: "Depósito", withdrawal: "Saque", purchase: "Compra",
  yield: "Rendimento", final_payout: "Pagamento final", spin: "Roleta",
  invite_bonus: "Bónus de convite", admin_adjust: "Ajuste",
};

function History() {
  const { user } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at",{ascending:false}).limit(200).then(({data}) => setTxs((data as Tx[])||[]));
    load();
    const ch = supabase.channel("hist").on("postgres_changes",{event:"*",schema:"public",table:"transactions",filter:`user_id=eq.${user.id}`},load).subscribe();
    return () => { supabase.removeChannel(ch); };
  },[user]);

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Histórico de transações</h1>
      <div className="space-y-2">
        {txs.length === 0 && <p className="text-muted-foreground">Sem transações ainda.</p>}
        {txs.map(t => (
          <Card key={t.id} className="p-3 flex justify-between items-center bg-card">
            <div>
              <p className="text-sm font-semibold">{TYPE_LABEL[t.type] || t.type}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-PT")}</p>
            </div>
            <div className="text-right">
              <p className={`font-bold ${Number(t.amount) >= 0 ? "text-success" : "text-destructive"}`}>
                {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toFixed(2)} MT
              </p>
              <p className="text-[10px] text-muted-foreground">Saldo: {Number(t.balance_after).toFixed(2)}</p>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
