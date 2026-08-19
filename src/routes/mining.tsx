import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Pickaxe } from "lucide-react";

export const Route = createFileRoute("/mining")({
  component: Mining,
  head: () => ({
    meta: [
      { title: "Fantastic — Mineração em tempo real" },
      { name: "description", content: "Acompanhe em tempo real os rendimentos dos produtos que comprou na Fantastic." },
      { property: "og:title", content: "Fantastic — Mineração em tempo real" },
      { property: "og:description", content: "Acompanhe em tempo real os rendimentos dos produtos que comprou na Fantastic." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alpharisee.lovable.app/mining" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [{ rel: "canonical", href: "https://alpharisee.lovable.app/mining" }],
  }),
});

interface Inv { id:string; product_name:string; category:string; amount:number; daily_yield_pct:number; duration_days:number; start_date:string; end_date:string; total_credited:number; status:string; }

function Mining() {
  const { user } = useAuth();
  const [invs, setInvs] = useState<Inv[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => supabase.from("investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setInvs((data as Inv[])||[]));
    load();
    const ch = supabase.channel("mining").on("postgres_changes", { event: "*", schema: "public", table: "investments", filter: `user_id=eq.${user.id}` }, load).subscribe();
    const t = setInterval(() => setTick((n) => n+1), 1000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [user]);

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2"><Pickaxe className="text-gold"/>Mineração em tempo real</h1>
      {invs.length === 0 && <p className="text-muted-foreground">Sem investimentos ativos. Compre um produto na página inicial.</p>}
      <div className="space-y-3">
        {invs.map((i) => {
          const start = new Date(i.start_date).getTime();
          const end = new Date(i.end_date).getTime();
          const now = Date.now();
          const elapsed = Math.max(0, now - start);
          const total = end - start;
          const pct = Math.min(100, (elapsed / total) * 100);
          const dailyMt = i.amount * (i.daily_yield_pct/100);
          const perSec = dailyMt / 86400;
          // Live earned approx for d30/d365 = perSec * elapsed (capped at total)
          const cap = i.category === "d5" ? dailyMt * i.duration_days : dailyMt * i.duration_days;
          const liveEarned = Math.min(cap, perSec * (elapsed/1000));
          return (
            <Card key={i.id} className="p-4 bg-gradient-card shadow-card">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold">{i.product_name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded ${i.status==="active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>{i.status === "active" ? "Ativo" : "Concluído"}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Investido: {Number(i.amount).toFixed(2)} MT · {i.daily_yield_pct}% / dia · {i.duration_days} dias</p>
              <Progress value={pct} className="mb-2 h-2" />
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-muted-foreground">Acumulando agora</p>
                  <p className="font-bold text-success font-mono">{liveEarned.toFixed(4)} MT</p>
                </div>
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-muted-foreground">Já creditado</p>
                  <p className="font-bold text-gold">{Number(i.total_credited).toFixed(2)} MT</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {i.category === "d5" ? "Pagamento total ao fim de 5 dias" : "Crédito diário às 00:00"}
              </p>
            </Card>
          );
        })}
      </div>
      {/* hidden tick */}
      <span className="hidden">{tick}</span>
    </AppShell>
  );
}
