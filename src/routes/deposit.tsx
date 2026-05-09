import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/deposit")({ component: Deposit });

const ACCOUNTS = {
  emola: { number: "861181963", name: "Kelvin Eque" },
  mpesa: { number: "841181963", name: "Kelvin Eque" },
};

function Deposit() {
  const nav = useNavigate();
  const [method, setMethod] = useState<"emola"|"mpesa">("emola");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("deposit-request", { body: { amount: Number(amount), method, reference, sender_phone: senderPhone }});
    setLoading(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error!.message);
    toast.success("Pedido enviado. Aguarde aprovação do ADM.");
    nav({ to: "/history" });
  };

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Depositar</h1>
      <Card className="p-4 mb-4 bg-gradient-card">
        <p className="text-sm text-muted-foreground mb-2">1. Envie o valor para a conta abaixo:</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant={method==="emola"?"default":"outline"} onClick={() => setMethod("emola")} className={method==="emola"?"bg-gradient-gold text-primary-foreground":""}>e-Mola</Button>
          <Button variant={method==="mpesa"?"default":"outline"} onClick={() => setMethod("mpesa")} className={method==="mpesa"?"bg-gradient-gold text-primary-foreground":""}>M-Pesa</Button>
        </div>
        <div className="bg-muted/40 rounded p-3 text-center">
          <p className="text-xs text-muted-foreground">Número {method === "emola" ? "e-Mola" : "M-Pesa"}</p>
          <p className="text-xl font-bold text-gold font-mono">{ACCOUNTS[method].number}</p>
          <p className="text-sm">{ACCOUNTS[method].name}</p>
        </div>
      </Card>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-muted-foreground">2. Preencha os dados do depósito:</p>
        <div><Label>Valor (MT)</Label><Input type="number" min={50} value={amount} onChange={e => setAmount(e.target.value)} required/></div>
        <div><Label>Referência da transação</Label><Input value={reference} onChange={e=>setReference(e.target.value)} required/></div>
        <div><Label>Seu número (remetente)</Label><Input value={senderPhone} onChange={e=>setSenderPhone(e.target.value)} required/></div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">{loading?"...":"Enviar pedido"}</Button>
      </form>
    </AppShell>
  );
}
