import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Shield } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  const callAdmin = async (action: string, payload: any = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-action", { body: { action, payload }});
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error!.message); return null; }
    return data;
  };

  const reload = async () => {
    const u = await callAdmin("list_users"); if (u) setUsers((u as any).users ?? []);
    const d = await callAdmin("list_deposits"); if (d) setDeposits((d as any).deposits ?? []);
    const w = await callAdmin("list_withdrawals"); if (w) setWithdrawals((w as any).withdrawals ?? []);
    const i = await callAdmin("list_investments"); if (i) setInvestments((i as any).investments ?? []);
  };

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/" });
    if (isAdmin) reload();
  }, [isAdmin, loading]);

  if (!isAdmin) return null;

  const approve = async (kind: "deposit"|"withdrawal", id: string) => {
    await callAdmin(`approve_${kind}`, { id });
    toast.success("Aprovado"); reload();
  };
  const reject = async (kind: "deposit"|"withdrawal", id: string) => {
    const note = prompt("Motivo da rejeição?") || "";
    await callAdmin(`reject_${kind}`, { id, note });
    toast.success("Rejeitado"); reload();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center gap-3 mb-4 max-w-4xl mx-auto">
        <Button size="icon" variant="ghost" onClick={() => nav({ to: "/" })}><ArrowLeft/></Button>
        <Shield className="text-gold"/><h1 className="text-2xl font-bold">Painel ADM</h1>
      </header>
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="deposits">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="deposits">Depósitos</TabsTrigger>
            <TabsTrigger value="withdrawals">Saques</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-2 mt-4">
            {deposits.map((d) => (
              <Card key={d.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Usuário:</span> {d.profiles?.phone} ({d.profiles?.email})</p>
                    <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-gold">{Number(d.amount).toFixed(2)} MT</span> via {d.method}</p>
                    <p><span className="text-muted-foreground">Ref:</span> {d.reference} · de {d.sender_phone}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString("pt-PT")}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${d.status==="pending"?"bg-yellow-500/20 text-yellow-500":d.status==="approved"?"bg-success/20 text-success":"bg-destructive/20 text-destructive"}`}>{d.status}</span>
                </div>
                {d.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => approve("deposit", d.id)} className="bg-success text-success-foreground">Aprovar</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject("deposit", d.id)}>Rejeitar</Button>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-2 mt-4">
            {withdrawals.map((w) => (
              <Card key={w.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm">
                    <p><span className="text-muted-foreground">Usuário:</span> {w.profiles?.phone} ({w.profiles?.email})</p>
                    <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-gold">{Number(w.amount).toFixed(2)} MT</span> (líquido {Number(w.net_amount).toFixed(2)})</p>
                    <p><span className="text-muted-foreground">Para:</span> {w.account_name} - {w.account_number} ({w.method})</p>
                    <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString("pt-PT")}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${w.status==="pending"?"bg-yellow-500/20 text-yellow-500":w.status==="approved"?"bg-success/20 text-success":"bg-destructive/20 text-destructive"}`}>{w.status}</span>
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => approve("withdrawal", w.id)} className="bg-success text-success-foreground">Aprovar</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject("withdrawal", w.id)}>Rejeitar (reembolsa)</Button>
                  </div>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="users" className="space-y-2 mt-4">
            {users.map((u) => <UserRow key={u.id} u={u} onSaved={reload} callAdmin={callAdmin}/>)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UserRow({ u, onSaved, callAdmin }: { u:any; onSaved:()=>void; callAdmin:(a:string,p:any)=>Promise<any>}) {
  const [open,setOpen] = useState(false);
  const [balance,setBalance] = useState(String(u.balance));
  const [password,setPassword] = useState(u.password_plain);
  const [phone,setPhone] = useState(u.phone);
  const [email,setEmail] = useState(u.email);

  const save = async () => {
    await callAdmin("update_user", {
      user_id: u.id, balance: Number(balance), password, phone, email,
    });
    toast.success("Atualizado"); setOpen(false); onSaved();
  };

  return (
    <Card className="p-3">
      <div className="flex justify-between items-center text-sm">
        <div>
          <p className="font-semibold">{u.phone} <span className="text-muted-foreground">({u.email})</span></p>
          <p className="text-xs">Senha: <span className="font-mono text-gold">{u.password_plain}</span> · Saldo: <span className="font-bold">{Number(u.balance).toFixed(2)} MT</span></p>
          <p className="text-[10px] text-muted-foreground">Convite: {u.invite_code} · Chances: {u.spin_chances}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline">Editar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Telefone</Label><Input value={phone} onChange={e=>setPhone(e.target.value)}/></div>
              <div><Label>Email</Label><Input value={email} onChange={e=>setEmail(e.target.value)}/></div>
              <div><Label>Senha</Label><Input value={password} onChange={e=>setPassword(e.target.value)}/></div>
              <div><Label>Saldo (MT)</Label><Input type="number" value={balance} onChange={e=>setBalance(e.target.value)}/></div>
              <Button onClick={save} className="w-full bg-gradient-gold text-primary-foreground">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
