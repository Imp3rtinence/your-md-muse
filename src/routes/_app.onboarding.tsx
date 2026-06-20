import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Sparkles, Languages } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeOnboarding } from "@/lib/ai/onboarding.functions";
import { embedMyProfile } from "@/lib/ai/embeddings.functions";
import { dynamicOnboardingQuestion } from "@/lib/ai/onboarding-quiz.functions";
import { LanguageGrid } from "@/components/LanguageGrid";

export const Route = createFileRoute("/_app/onboarding")({
  head: () => ({ meta: [{ title: "Willkommen – Komma" }] }),
  component: Onboarding,
});

const INTEREST_IDS = ["bewegung", "kreativ", "lernen", "sozial", "natur", "mut", "musik", "essen"] as const;
const INTEREST_EMOJI: Record<string, string> = {
  bewegung: "🚴", kreativ: "🎨", lernen: "📚", sozial: "🤝", natur: "🌿", mut: "🔥", musik: "🎧", essen: "🍳",
};

const CONTEXT_IDS = ["friends", "school", "sport", "neighborhood", "solo"] as const;
const CONTEXT_EMOJI: Record<string, string> = {
  friends: "👥", school: "🏫", sport: "⚽", neighborhood: "🏘️", solo: "🙂",
};

function Onboarding() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuth();
  const analyze = useServerFn(analyzeOnboarding);
  const embedMe = useServerFn(embedMyProfile);
  const askDynamic = useServerFn(dynamicOnboardingQuestion);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [ctx, setCtx] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dynQ, setDynQ] = useState<null | { question: string; options: { id: string; label: string; emoji: string }[] }>(null);
  const [dynBusy, setDynBusy] = useState(false);
  const [dynAnswer, setDynAnswer] = useState<{ question: string; answer: string } | null>(null);

  const toggle = (id: string) =>
    setInterests((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));

  const goToDynamic = async () => {
    setDynBusy(true);
    setStep(3);
    try {
      const q = await askDynamic({ data: { interests } });
      setDynQ(q);
    } catch {
      setDynQ(null);
      setStep(4);
    } finally {
      setDynBusy(false);
    }
  };

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ interests, onboarded_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
      analyze({
        data: {
          interests,
          context: (ctx ?? "") + (dynAnswer ? ` | ${dynAnswer.question} → ${dynAnswer.answer}` : ""),
        },
      })
        .then(() => embedMe())
        .catch((e) => console.warn("AI analyze failed", e));
      await refreshProfile();
      toast.success("✨");
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
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-2"}`} />
          ))}
        </div>

        {step === 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Languages className="size-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Komma</span>
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight">{t("onboarding.languageTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.languageSubtitle")}</p>
            <LanguageGrid />
            <button onClick={() => setStep(1)}
              className="tap mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display font-bold text-primary-foreground glow-primary">
              {t("common.next")} <ArrowRight className="size-5" />
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <div className="font-display text-3xl font-bold leading-tight">
              <Trans i18nKey="onboarding.welcomeTitle" components={{ 1: <span className="text-primary" /> }} />
              <br />
              {t("onboarding.welcomeTitleLine2")}
            </div>
            <p className="text-sm text-foreground/75">{t("onboarding.welcomeText")}</p>
            <div className="rounded-3xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-primary/15"><Sparkles className="size-5 text-primary" /></span>
                <div>
                  <div className="font-display text-base font-semibold">{t("onboarding.howItWorks")}</div>
                  <div className="text-xs text-muted-foreground">{t("onboarding.howItWorksDetail")}</div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="tap flex-1 rounded-2xl bg-surface px-5 py-3.5 font-display font-semibold">{t("common.back")}</button>
              <button onClick={() => setStep(2)}
                className="tap flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-display font-bold text-primary-foreground glow-primary">
                {t("onboarding.go")} <ArrowRight className="size-5" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h1 className="font-display text-2xl font-bold leading-tight">{t("onboarding.interestsTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.interestsSubtitle")}</p>
            <div className="grid grid-cols-2 gap-2">
              {INTEREST_IDS.map((id) => {
                const on = interests.includes(id);
                return (
                  <button key={id} onClick={() => toggle(id)}
                    className={`tap flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{INTEREST_EMOJI[id]}</span>
                      <span className="font-display text-sm font-semibold">{t(`onboarding.interests.${id}`)}</span>
                    </span>
                    {on && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="tap flex-1 rounded-2xl bg-surface px-5 py-3.5 font-display font-semibold">{t("common.back")}</button>
              <button onClick={goToDynamic} disabled={interests.length === 0}
                className="tap flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground glow-primary disabled:opacity-50">
                {t("common.next")} <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h1 className="font-display text-2xl font-bold leading-tight">
              {dynQ?.question ?? t("onboarding.dynamicWaitTitle")}
            </h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-accent" /> {t("onboarding.dynamicHint")}
            </p>
            {dynBusy && !dynQ && (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("onboarding.dynamicThinking")}
              </div>
            )}
            {dynQ && (
              <div className="space-y-2">
                {dynQ.options.map((o) => {
                  const on = dynAnswer?.answer === o.label;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setDynAnswer({ question: dynQ.question, answer: o.label })}
                      className={`tap flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}
                    >
                      <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-xl">{o.emoji}</span>
                      <span className="flex-1 font-display text-sm font-semibold">{o.label}</span>
                      {on && <Check className="size-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="tap flex-1 rounded-2xl bg-surface px-5 py-3.5 font-display font-semibold">{t("common.back")}</button>
              <button onClick={() => setStep(4)} disabled={dynBusy}
                className="tap flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground glow-primary disabled:opacity-50">
                {dynAnswer ? t("common.next") : t("common.skip")} <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <h1 className="font-display text-2xl font-bold leading-tight">{t("onboarding.contextTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.contextSubtitle")}</p>
            <div className="space-y-2">
              {CONTEXT_IDS.map((id) => {
                const on = ctx === id;
                return (
                  <button key={id} onClick={() => setCtx(id)}
                    className={`tap flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-xl">{CONTEXT_EMOJI[id]}</span>
                    <span className="flex-1 font-display text-sm font-semibold">{t(`onboarding.contexts.${id}`)}</span>
                    {on && <Check className="size-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(3)} className="tap flex-1 rounded-2xl bg-surface px-5 py-3.5 font-display font-semibold">{t("common.back")}</button>
              <button onClick={finish} disabled={busy || !ctx}
                className="tap flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground glow-primary disabled:opacity-60">
                {busy ? <Loader2 className="size-5 animate-spin" /> : <>{t("common.done")} <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
