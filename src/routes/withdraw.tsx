import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/withdraw")({ component: Withdraw });

function Withdraw() {
  const { profile, refresh } = useAuth();
  const nav = useNavigate();
  const [method, setMethod] = useState<"emola"|"mpesa">("emola");
  const [amount, setAmount] = useState("");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const fee = Number(amount||0) * 0.05;
  const net = Number(amount||0) - fee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("withdraw-request", {
      body: { amount: Number(amount), method, account_number: number, account_name: name }
    });
    setLoading(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error!.message);
    toast.success("Pedido enviado. Aguarde aprovação.");
    refresh();
    nav({ to: "/history" });
  };

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Sacar</h1>
      <Card className="p-4 mb-4 bg-gradient-card">
        <p className="text-sm">Saldo disponível: <span className="font-bold text-gold">{(profile?.balance ?? 0).toFixed(2)} MT</span></p>
        <p className="text-xs text-muted-foreground mt-1">Mínimo 150 MT · Taxa 5% · Requer pelo menos 1 produto ativo</p>
        <p className="text-xs text-muted-foreground mt-1">Horário de saque: Segunda a Sexta, 08:30 às 18:00 · Processamento até 12h</p>
      </Card>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={method==="emola"?"default":"outline"} onClick={() => setMethod("emola")} className={method==="emola"?"bg-gradient-gold text-primary-foreground":""}>e-Mola</Button>
          <Button type="button" variant={method==="mpesa"?"default":"outline"} onClick={() => setMethod("mpesa")} className={method==="mpesa"?"bg-gradient-gold text-primary-foreground":""}>M-Pesa</Button>
        </div>
        <div><Label>Valor a sacar (MT)</Label><Input type="number" min={150} value={amount} onChange={e=>setAmount(e.target.value)} required/></div>
        <div><Label>Número da conta</Label><Input value={number} onChange={e=>setNumber(e.target.value)} required/></div>
        <div><Label>Nome da conta</Label><Input value={name} onChange={e=>setName(e.target.value)} required/></div>
        {Number(amount) >= 150 && (
          <Card className="p-3 text-sm bg-muted/40">
            <p>Taxa (5%): <span className="font-bold">{fee.toFixed(2)} MT</span></p>
            <p>Recebe: <span className="font-bold text-success">{net.toFixed(2)} MT</span></p>
          </Card>
        )}
        <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">{loading?"...":"Solicitar saque"}</Button>
      </form>
    </AppShell>
  );
}
