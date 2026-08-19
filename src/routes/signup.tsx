import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logoAsset from "@/assets/fantastic-logo.png.asset.json";

export const Route = createFileRoute("/signup")({
  component: Signup,
  validateSearch: (s: Record<string, unknown>): { ref?: string } => ({ ref: (s.ref as string) || "" }),
});

function Signup() {
  const nav = useNavigate();
  const { ref } = Route.useSearch();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [inviteCode, setInviteCode] = useState(ref);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{9}$/.test(phone)) return toast.error("Número de Moçambique inválido (9 dígitos)");
    if (!/^[\w.+-]+@gmail\.com$/i.test(email)) return toast.error("Use um Gmail válido");
    if (password.length < 6) return toast.error("Senha mínima de 6 caracteres");
    if (password !== confirmPassword) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { phone, invite_code: inviteCode || null },
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
          <img src={logoAsset.url} alt="Logótipo Fantastic" className="w-12 h-12 rounded-xl object-cover" />
          <h1 className="text-2xl font-bold text-gold">Criar conta</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="su-phone">Número de Moçambique</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
                +258
              </span>
              <Input
                id="su-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="84xxxxxxx"
                maxLength={9}
                className="rounded-l-none"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="su-email">Gmail</Label>
            <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@gmail.com" />
          </div>
          <div>
            <Label htmlFor="su-password">Senha</Label>
            <div className="relative">
              <Input
                id="su-password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="su-password2">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="su-password2"
                type={showPwd2 ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd2((v) => !v)}
                aria-label={showPwd2 ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPwd2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="su-invite">Código de convite (opcional)</Label>
            <Input id="su-invite" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} />
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
