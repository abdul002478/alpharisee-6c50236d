import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Home, History, Pickaxe, ArrowDownToLine, ArrowUpFromLine, Sparkles, Shield, LogOut, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/fantastic-logo.png.asset.json";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const loc = useLocation();

  const tabs = [
    { to: "/", label: "Início", icon: Home },
    { to: "/mining", label: "Mineração", icon: Pickaxe },
    { to: "/invite", label: "Convidar", icon: Gift },
    { to: "/spin", label: "Roleta", icon: Sparkles },
    { to: "/history", label: "Histórico", icon: History },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Logótipo Fantastic" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <p className="text-xs text-muted-foreground">Fantastic · Saldo</p>
              <p className="text-lg font-bold text-gold">{(profile?.balance ?? 0).toFixed(2)} MT</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/deposit"><Button size="sm" variant={loc.pathname==="/deposit"?"default":"secondary"} className={loc.pathname==="/deposit"?"bg-gradient-gold text-primary-foreground":""}><ArrowDownToLine className="w-4 h-4 mr-1"/>Depositar</Button></Link>
            <Link to="/withdraw"><Button size="sm" variant={loc.pathname==="/withdraw"?"default":"secondary"} className={loc.pathname==="/withdraw"?"bg-gradient-gold text-primary-foreground":""}><ArrowUpFromLine className="w-4 h-4 mr-1"/>Sacar</Button></Link>
            {isAdmin && <Link to="/admin"><Button size="icon" variant="outline" aria-label="Painel de administração"><Shield className="w-4 h-4"/></Button></Link>}
            <Button size="icon" variant="ghost" onClick={signOut} aria-label="Terminar sessão"><LogOut className="w-4 h-4"/></Button>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4">{children}</main>
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-30">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {tabs.map((t) => {
            const active = loc.pathname === t.to;
            const Icon = t.icon;
            return (
              <Link key={t.to} to={t.to} className={`flex flex-col items-center py-3 text-xs ${active ? "text-gold" : "text-muted-foreground"}`}>
                <Icon className="w-5 h-5 mb-1" />{t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
