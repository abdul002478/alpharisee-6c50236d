import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Clock, TrendingUp, Coins, MessageCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const WHATSAPP_MANAGER = "https://chat.whatsapp.com/KHn1AyGbd4o1nOg6Q0xtju";

export const Route = createFileRoute("/")({ component: Index });

interface Product {
  id: string; name: string; category: "d5"|"d30"|"d365";
  duration_days: number; daily_yield_pct: number; price: number;
}

const CAT_INFO = {
  d5: { label: "5 dias", color: "from-rose-500 to-orange-500", desc: "40% / dia · pagamento total ao fim" },
  d30: { label: "30 dias", color: "from-emerald-500 to-teal-500", desc: "10% / dia · creditado diariamente" },
  d365: { label: "365 dias", color: "from-amber-500 to-yellow-600", desc: "2% / dia · creditado diariamente" },
};

function Index() {
  const { user, profile, loading, refresh } = useAuth();
  const nav = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    supabase.from("products").select("*").eq("active", true).order("category").order("display_order")
      .then(({ data }) => setProducts((data as Product[]) || []));
  }, []);

  const buy = async (p: Product) => {
    if (!profile) return;
    if (profile.balance < p.price) return toast.error("Saldo insuficiente. Faça um depósito.");
    setBuying(p.id);
    const { data, error } = await supabase.functions.invoke("purchase", { body: { product_id: p.id } });
    setBuying(null);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error!.message);
    toast.success(`${p.name} comprado!`);
    refresh();
  };

  const byCat = (c: string) => products.filter((p) => p.category === c);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">A carregar...</div>;

  return (
    <AppShell>
      <Card className="p-5 mb-4 bg-gradient-gold text-primary-foreground shadow-gold">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Investimentos disponíveis</p>
            <h2 className="text-xl font-bold">Cresça o seu capital</h2>
          </div>
          <Coins className="w-10 h-10 opacity-80" />
        </div>
      </Card>

      <Tabs defaultValue="d5" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-card">
          <TabsTrigger value="d5">5 dias</TabsTrigger>
          <TabsTrigger value="d30">30 dias</TabsTrigger>
          <TabsTrigger value="d365">365 dias</TabsTrigger>
        </TabsList>
        {(["d5","d30","d365"] as const).map((c) => (
          <TabsContent key={c} value={c} className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {byCat(c).map((p) => {
                const dailyReturn = (p.price * p.daily_yield_pct) / 100;
                const total = c === "d5" ? p.price * p.daily_yield_pct / 100 * p.duration_days : dailyReturn * p.duration_days;
                return (
                  <Card key={p.id} className="p-3 bg-gradient-card shadow-card border-border">
                    <div className="mb-2">
                      <h3 className="font-bold text-foreground text-sm leading-tight">{p.name}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3"/> {p.duration_days}d · {p.daily_yield_pct}%/dia
                      </p>
                    </div>
                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r ${CAT_INFO[c].color} text-white mb-2`}>
                      {CAT_INFO[c].label}
                    </div>
                    <div className="space-y-1 mb-2 text-[11px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">Preço</span><span className="font-bold">{p.price.toFixed(0)} MT</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">{c === "d5" ? "Total/dia" : "Diário"}</span><span className="font-bold text-success">{dailyReturn.toFixed(0)} MT</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-gold">{total.toFixed(0)} MT</span></div>
                    </div>
                    <Button onClick={() => buy(p)} disabled={buying === p.id || (profile?.balance ?? 0) < p.price}
                      size="sm" className="w-full bg-gradient-gold text-primary-foreground font-semibold text-xs h-8">
                      <TrendingUp className="w-3 h-3 mr-1"/>{buying === p.id ? "..." : "Comprar"}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
