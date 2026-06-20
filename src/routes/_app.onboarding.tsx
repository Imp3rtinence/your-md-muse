import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({ meta: [{ title: "Willkommen – Komma" }] }),
  component: Onboarding,
});

type Interest = { id: string; label: string; emoji: string };

const INTERESTS: Interest[] = [
  { id: "bewegung", label: "Bewegung", emoji: "🚴" },
  { id: "kreativ", label: "Kreativität", emoji: "🎨" },
  { id: "lernen", label: "Lernen", emoji: "📚" },
  { id: "sozial", label: "Soziales", emoji: "🤝" },
  { id: "natur", label: "Natur", emoji: "🌿" },
  { id: "mut", label: "Mut", emoji: "🔥" },
  { id: "musik", label: "Musik", emoji: "🎧" },
  { id: "essen", label: "Kochen", emoji: "🍳" },
];

const CONTEXTS: Interest[] = [
  { id: "friends", label: "Freunde", emoji: "👥" },
  { id: "school", label: "Schule", emoji: "🏫" },
  { id: "sport", label: "Verein / Sport", emoji: "⚽" },
  { id: "neighborhood", label: "Nachbarschaft", emoji: "🏘️" },
  { id: "solo", label: "Erstmal allein", emoji: "🙂" },
];

function Onboarding() {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [ctx, setCtx] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setInterests((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ interests, onboarded_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Los geht's!");
      nav({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Hat nicht geklappt");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] px-5 pb-8 pt-8">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full blur-3xl opacity-40" style={{ background: "var(--primary)" }} />
      <div className="relative mx-auto flex max-w-md flex-col gap-6">
        {/* Progress */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-2"}`} />
          ))}
        </div>

        {step === 0 && (
          <section className="space-y-4">
            <div className="font-display text-3xl font-bold leading-tight">
              Willkommen bei <span className="text-primary">Komma</span>,<br />schön dass du da bist.
            </div>
            <p className="text-sm text-foreground/75">
              Komma ist eine kleine Pause vom Scrollen — und ein Anstupser, mal wirklich was zu machen.
              Drei kurze Fragen, dann bist du drin.
            </p>
            <div className="rounded-3xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/15"><Sparkles className="size-5 text-primary" /></span>
                <div>
                  <div className="font-display text-base font-semibold">So funktioniert's</div>
                  <div className="text-xs text-muted-foreground">Challenge starten · Beweis posten · Aura sammeln</div>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(1)}
              className="tap mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display font-bold text-primary-foreground glow-primary">
              Los <ArrowRight className="size-5" />
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h1 className="font-display text-2xl font-bold leading-tight">Worauf hast du Lust?</h1>
            <p className="text-sm text-muted-foreground">Wähl bis zu vier. Wir schlagen dir dazu passende Challenges vor.</p>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS.map((i) => {
                const on = interests.includes(i.id);
                return (
                  <button key={i.id} onClick={() => toggle(i.id)}
                    className={`tap flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{i.emoji}</span>
                      <span className="font-display text-sm font-semibold">{i.label}</span>
                    </span>
                    {on && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="tap flex-1 rounded-2xl bg-surface px-5 py-3.5 font-display font-semibold">Zurück</button>
              <button onClick={() => setStep(2)} disabled={interests.length === 0}
                className="tap flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground glow-primary disabled:opacity-50">
                Weiter <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h1 className="font-display text-2xl font-bold leading-tight">Mit wem willst du machen?</h1>
            <p className="text-sm text-muted-foreground">Du kannst später jederzeit weitere Crews gründen oder beitreten.</p>
            <div className="space-y-2">
              {CONTEXTS.map((c) => {
                const on = ctx === c.id;
                return (
                  <button key={c.id} onClick={() => setCtx(c.id)}
                    className={`tap flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-xl">{c.emoji}</span>
                    <span className="flex-1 font-display text-sm font-semibold">{c.label}</span>
                    {on && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="tap flex-1 rounded-2xl bg-surface px-5 py-3.5 font-display font-semibold">Zurück</button>
              <button onClick={finish} disabled={busy || !ctx}
                className="tap flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground glow-primary disabled:opacity-60">
                {busy ? <Loader2 className="size-5 animate-spin" /> : <>Fertig <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
