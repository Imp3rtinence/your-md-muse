import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Users, Link2, ArrowRight, Flag, Camera, Send, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Komma – Machen statt scrollen" },
      { name: "description", content: "Herausforderungen annehmen, Beweise liefern und die Kette am Leben halten. Die Mitmach-App für deine Crew." },
      { property: "og:title", content: "Komma – Machen statt scrollen" },
      { property: "og:description", content: "Herausforderungen annehmen, Beweise liefern und die Kette am Leben halten." },
      { property: "og:url", content: "https://komma.fun/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://komma.fun/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Komma",
          url: "https://komma.fun/",
          description: "Die Mitmach-App für deine Crew: Challenges starten, Beweise liefern, Kette weiterreichen.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Komma",
          url: "https://komma.fun/",
          legalName: "Gotham Consulting GmbH",
        }),
      },
    ],
  }),
  component: Landing,
});


function Landing() {
  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full opacity-30 blur-[100px]" style={{ background: "var(--primary)" }} />
        <div className="absolute bottom-10 -right-20 size-80 rounded-full opacity-20 blur-[120px]" style={{ background: "var(--accent)" }} />
      </div>

      <div
        className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-7 px-6 pt-10"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="font-display text-2xl font-bold tracking-tighter">
            Komma<span className="text-primary">,</span>
          </div>
          <Link to="/auth" className="tap text-sm font-medium text-foreground/70 transition-opacity hover:text-foreground">
            Anmelden
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center gap-6 text-center">
          {/* Hero claim */}
          <section className="space-y-4">
            <h1 className="font-display text-[52px] font-bold leading-[0.92] tracking-tight">
              Machen <br />
              <span className="text-primary">statt</span> <br />
              scrollen.
            </h1>
            <p className="mx-auto max-w-[300px] text-[15px] leading-relaxed text-foreground/75">
              Herausforderungen annehmen, Beweise liefern und die Kette am Leben halten.
            </p>
          </section>

          {/* So läuft's – 3 Schritte */}
          <ol className="flex items-center justify-center gap-2 text-[11px] font-medium text-foreground/70">
            <Step icon={<Flag className="size-3.5" />} label="Starten" n={1} />
            <Dash />
            <Step icon={<Camera className="size-3.5" />} label="Beweisen" n={2} />
            <Dash />
            <Step icon={<Send className="size-3.5" />} label="Weiterreichen" n={3} />
          </ol>

          {/* Hero Daily Challenge */}
          <Link
            to="/auth"
            className="group relative block overflow-hidden rounded-3xl border border-border bg-surface/70 transition-colors hover:border-accent"
            style={{ boxShadow: "0 20px 60px -20px color-mix(in oklab, var(--accent) 35%, transparent)" }}
          >
            {/* Thumbnail */}
            <div
              className="relative h-32 w-full overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--primary) 70%, transparent) 0%, color-mix(in oklab, var(--accent) 60%, transparent) 100%)",
              }}
            >
              <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 40%, oklch(1 0 0 / 0.35), transparent 55%)" }} />
              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground" style={{ background: "var(--accent)" }}>
                <span className="size-1.5 rounded-full bg-current animate-pulse" />
                Heute
              </div>
              <div className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/40 backdrop-blur-md">
                <Zap className="size-4 text-accent" strokeWidth={2.5} />
              </div>
            </div>

            {/* Card body */}
            <div className="space-y-4 p-5">
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  Daily Challenge
                </div>
                <h2 className="font-display text-xl font-bold leading-snug text-foreground">
                  Mach das beste 3-Sekunden-Tutorial.
                </h2>

              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    <Avatar color="var(--primary)" letter="L" />
                    <Avatar color="var(--accent)" letter="M" />
                    <Avatar color="oklch(0.78 0.18 200)" letter="J" />
                  </div>
                  <span className="text-[13px] font-medium text-foreground/85">
                    3 Freunde machen mit
                  </span>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  Mitmachen
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </Link>

          {/* Sekundäre Infos – flacher, ohne Button-Optik */}
          <div className="grid grid-cols-2 gap-3">
            <InfoTile icon={<Users className="size-4 text-primary" strokeWidth={2.2} />} title="Freunde" />
            <InfoTile icon={<Link2 className="size-4 text-accent" strokeWidth={2.2} />} title="Die Kette" />
          </div>

          {/* CTA */}
          <div className="mt-auto flex flex-col items-center gap-3 pt-2">
            <Link
              to="/auth"
              className="tap flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-bold text-primary-foreground shadow-[0_20px_40px_-10px_color-mix(in_oklab,var(--primary)_50%,transparent)] transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]"
            >
              Loslegen
              <ArrowRight className="size-5" strokeWidth={2.5} />
            </Link>
            <Link to="/auth" className="tap text-[13px] font-medium text-foreground/65 underline-offset-4 hover:text-foreground hover:underline">
              Schon dabei? Einloggen
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function Step({ icon, label, n }: { icon: React.ReactNode; label: string; n: number }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className="flex size-6 items-center justify-center rounded-full bg-surface-2 text-accent">
        {icon}
      </span>
      <span className="text-foreground/80">
        <span className="text-foreground/45">{n}.</span> {label}
      </span>
    </li>
  );
}

function Dash() {
  return <span className="h-px w-3 flex-shrink bg-foreground/15" aria-hidden />;
}

function Avatar({ color, letter }: { color: string; letter: string }) {
  return (
    <span
      className="flex size-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold text-background"
      style={{ background: color }}
    >
      {letter}
    </span>
  );
}

function InfoTile({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface/40 px-4 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-2">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold leading-tight text-foreground">{title}</div>
        {sub && <div className="text-[11px] leading-tight text-foreground/60">{sub}</div>}
      </div>
    </div>
  );
}
