import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let email = identifier.trim();
    // Allow login by phone
    if (/^\d{9}$/.test(email)) {
      const { data } = await supabase.from("profiles").select("email").eq("phone", email).maybeSingle();
      if (!data) { setLoading(false); return toast.error("Número não encontrado"); }
      email = data.email;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Credenciais inválidas");
    toast.success("Bem-vindo!");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-gradient-card shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-gold">Entrar</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Gmail ou Número</Label>
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email@gmail.com ou 84xxxxxxx" />
          </div>
          <div>
            <Label>Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold">
            {loading ? "..." : "Entrar"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Ainda não tem conta? <Link to="/signup" className="text-gold underline">Criar</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
