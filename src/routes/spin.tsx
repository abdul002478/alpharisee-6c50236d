import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/spin")({ component: Spin });

const VISUAL = [20, 250, 40, 500, 60, 1000, 80, 99];
const COLORS = ["#fbbf24","#dc2626","#fbbf24","#dc2626","#fbbf24","#dc2626","#fbbf24","#dc2626"];

function Spin() {
  const { profile, refresh } = useAuth();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number|null>(null);

  const spin = async () => {
    if (!profile || profile.spin_chances < 1) return toast.error("Sem chances disponíveis");
    setSpinning(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("spin");
    if (error || (data as any)?.error) {
      setSpinning(false);
      return toast.error((data as any)?.error || error!.message);
    }
    const { prize, visualIndex } = data as { prize: number; visualIndex: number };
    // segment 0 is at top; rotate so that segment lands at top pointer
    const segAngle = 360 / VISUAL.length;
    const target = 360 * 6 - (visualIndex * segAngle) - segAngle/2; // center of segment
    setRotation(target);
    setTimeout(() => {
      setSpinning(false);
      setResult(prize);
      refresh();
      toast.success(`Ganhou ${prize} MT!`);
    }, 4200);
  };

  return (
    <AppShell>
      <h1 className="text-xl font-bold mb-2 flex items-center gap-2"><Sparkles className="text-gold"/>Roleta da Sorte</h1>
      <p className="text-sm text-muted-foreground mb-4">Chances disponíveis: <span className="text-gold font-bold">{profile?.spin_chances ?? 0}</span></p>

      <div className="relative w-72 h-72 mx-auto my-6">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gold"/>
        <div
          className="w-full h-full rounded-full border-4 border-gold shadow-gold relative overflow-hidden"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.21, 1)" : "none",
            background: `conic-gradient(${VISUAL.map((_,i) => `${COLORS[i]} ${i*45}deg ${(i+1)*45}deg`).join(",")})`,
          }}
        >
          {VISUAL.map((v, i) => {
            const angle = i * 45 + 22.5;
            return (
              <div key={i} className="absolute left-1/2 top-1/2 origin-bottom-left text-white font-bold text-sm" style={{
                transform: `rotate(${angle}deg) translateY(-105px) rotate(180deg)`,
              }}>{v}MT</div>
            );
          })}
        </div>
        <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-gold border-4 border-card" />
      </div>

      <Button onClick={spin} disabled={spinning || (profile?.spin_chances ?? 0) < 1} className="w-full bg-gradient-gold text-primary-foreground font-bold text-lg py-6">
        {spinning ? "A girar..." : "GIRAR"}
      </Button>
      {result !== null && !spinning && (
        <Card className="p-4 mt-4 text-center bg-gradient-card">
          <p className="text-sm text-muted-foreground">Você ganhou</p>
          <p className="text-3xl font-bold text-gold">{result} MT</p>
        </Card>
      )}
      <Card className="p-3 mt-4 bg-card text-xs text-muted-foreground">
        <p>• Bónus de boas-vindas: 1 chance grátis</p>
        <p>• Convide amigos: ganhe +1 chance por cada primeira compra</p>
      </Card>
    </AppShell>
  );
}
