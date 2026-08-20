import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "fantastic-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setDeferred(null));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!deferred) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Instalar a Fantastic</p>
        <p className="text-xs text-muted-foreground">Adicione o app ao seu ecrã inicial.</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
      >
        <Download className="h-4 w-4" />
        Instalar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar convite de instalação"
        className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
