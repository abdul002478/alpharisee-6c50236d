import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Gift, Copy, Share2 } from "lucide-react";

export const Route = createFileRoute("/invite")({ component: Invite });

function Invite() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  if (!profile) return null;

  const link = `${window.location.origin}/signup?ref=${profile.invite_code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Junta-te a mim", text: "Investe e ganha comigo!", url: link }); }
      catch {}
    } else copy();
  };

  return (
    <AppShell>
      <Card className="p-6 mb-4 bg-gradient-gold text-primary-foreground shadow-gold text-center">
        <Gift className="w-12 h-12 mx-auto mb-2 opacity-90" />
        <h1 className="text-2xl font-bold">Convide amigos</h1>
        <p className="text-sm opacity-90 mt-1">Ganhe 18% da primeira compra do convidado + 1 chance na roleta</p>
      </Card>

      <Card className="p-4 mb-3 bg-card">
        <p className="text-xs text-muted-foreground mb-1">Seu código de convite</p>
        <p className="font-mono font-bold text-gold text-2xl text-center py-2">{profile.invite_code}</p>
      </Card>

      <Card className="p-4 mb-3 bg-card">
        <p className="text-xs text-muted-foreground mb-2">Seu link</p>
        <p className="text-xs break-all bg-muted/40 rounded p-2 mb-3">{link}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={copy} variant="outline"><Copy className="w-4 h-4 mr-1" />Copiar</Button>
          <Button onClick={share} className="bg-gradient-gold text-primary-foreground"><Share2 className="w-4 h-4 mr-1" />Partilhar</Button>
        </div>
      </Card>
    </AppShell>
  );
}
