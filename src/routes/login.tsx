import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

function safeNext(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Fantastic — Entrar na sua conta" },
      { name: "description", content: "Aceda à sua conta Fantastic para gerir investimentos, depósitos e saques." },
      { property: "og:title", content: "Fantastic — Entrar na sua conta" },
      { property: "og:description", content: "Aceda à sua conta Fantastic para gerir investimentos, depósitos e saques." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alpharisee.lovable.app/login" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [{ rel: "canonical", href: "https://alpharisee.lovable.app/login" }],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({ next: safeNext(s.next) }),
});

function Login() {
  const nav = useNavigate();
  const { next } = Route.useSearch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
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
    if (next) { window.location.href = next; return; }
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-gradient-card shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <img src="/icons/icon-192.png" alt="Logótipo Fantastic" className="w-12 h-12 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-gold leading-none">Fantastic</h1>
            <p className="text-xs text-muted-foreground">Entrar na sua conta</p>
          </div>

        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Gmail ou Número</Label>
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email@gmail.com ou 84xxxxxxx" />
          </div>
          <div>
            <Label>Senha</Label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
