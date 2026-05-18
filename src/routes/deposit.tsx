import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/deposit")({ component: Deposit });

const ACCOUNTS = {
  emola: { number: "871144722", name: "ARGELIO MARIO JOSÉ" },
  mpesa: { number: "842960119", name: "LINA PUANELA NURO" },
};

function Deposit() {
  const nav = useNavigate();
  const [method, setMethod] = useState<"emola"|"mpesa">("emola");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [loading, setLoading] = useState(false);

  const copyNumber = () => {
    navigator.clipboard.writeText(ACCOUNTS[method].number);
    toast.success("Número copiado");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("deposit-request", { body: { amount: Number(amount), method, reference, sender_phone: senderPhone, sender_name: senderName }});
    setLoading(false);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error!.message);
    toast.success("Pedido enviado. Aguarde aprovação do ADM.");
    nav({ to: "/history" });
  };

  const instructions = method === "emola" ? [
    "Abra a aplicação e-Mola no seu telefone",
    "Selecione \"Transferir Dinheiro\"",
    `Insira o número ${ACCOUNTS.emola.number} (${ACCOUNTS.emola.name})`,
    "Introduza o valor que deseja depositar",
    "Confirme com o seu PIN",
    "Copie a referência da transação e preencha o formulário abaixo",
  ] : [
    "Marque *150# ou abra a app M-Pesa",
    "Escolha \"Enviar Dinheiro\"",
    `Insira o número ${ACCOUNTS.mpesa.number} (${ACCOUNTS.mpesa.name})`,
    "Introduza o valor que deseja depositar",
    "Confirme com o seu PIN M-Pesa",
    "Copie a referência da transação e preencha o formulário abaixo",
  ];

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-4">Depositar</h1>
      <Card className="p-4 mb-4 bg-gradient-card">
        <p className="text-sm text-muted-foreground mb-2">1. Escolha o método e envie o valor:</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button type="button" variant={method==="emola"?"default":"outline"} onClick={() => setMethod("emola")} className={method==="emola"?"bg-gradient-gold text-primary-foreground":""}>e-Mola</Button>
          <Button type="button" variant={method==="mpesa"?"default":"outline"} onClick={() => setMethod("mpesa")} className={method==="mpesa"?"bg-gradient-gold text-primary-foreground":""}>M-Pesa</Button>
        </div>
        <div className="bg-muted/40 rounded p-3 text-center">
          <p className="text-xs text-muted-foreground">Número {method === "emola" ? "e-Mola" : "M-Pesa"}</p>
          <button type="button" onClick={copyNumber} className="text-xl font-bold text-gold font-mono inline-flex items-center gap-2 hover:opacity-80">
            {ACCOUNTS[method].number} <Copy className="w-4 h-4"/>
          </button>
          <p className="text-sm">{ACCOUNTS[method].name}</p>
        </div>
      </Card>

      <Card className="p-4 mb-4 bg-card">
        <p className="text-sm font-semibold mb-2">Como depositar via {method === "emola" ? "e-Mola" : "M-Pesa"}</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          {instructions.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <p className="text-xs text-gold mt-2">Depósito mínimo: 400 MT</p>
      </Card>

      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-muted-foreground">2. Preencha os dados do depósito:</p>
        <div><Label>Valor (MT)</Label><Input type="number" min={400} value={amount} onChange={e => setAmount(e.target.value)} required/></div>
        <div><Label>Referência da transação</Label><Input value={reference} onChange={e=>setReference(e.target.value)} required/></div>
        <div><Label>Nome de quem fez a transferência</Label><Input value={senderName} onChange={e=>setSenderName(e.target.value)} required/></div>
        <div><Label>Número de quem fez a transferência</Label><Input value={senderPhone} onChange={e=>setSenderPhone(e.target.value)} required/></div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">{loading?"...":"Enviar pedido"}</Button>
      </form>
    </AppShell>
  );
}
