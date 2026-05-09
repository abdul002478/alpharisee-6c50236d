import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: Signup,
  validateSearch: (s: Record<string, unknown>) => ({ ref: (s.ref as string) || "" }),
});

function Signup() {
  const nav = useNavigate();
  const { ref } = Route.useSearch();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(ref);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{9}$/.test(phone)) return toast.error("Número de Moçambique inválido (9 dígitos)");
    if (!/^[\w.+-]+@gmail\.com$/i.test(email)) return toast.error("Use um Gmail válido");
    if (password.length < 6) return toast.error("Senha mínima de 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { phone, password_plain: password, invite_code: inviteCode || null },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Bónus: 1 chance na roleta 🎉");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-gradient-card shadow-card border-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gold">Criar conta</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Número de Moçambique</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="84xxxxxxx" maxLength={9} />
          </div>
          <div>
            <Label>Gmail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@gmail.com" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Código de convite (opcional)</Label>
            <Input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
            {loading ? "A criar..." : "Criar conta"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-gold underline">Entrar</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
