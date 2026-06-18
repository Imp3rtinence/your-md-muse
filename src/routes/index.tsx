import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Zap, Users, Link2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JoinUs – Mitmachen statt zuschauen" },
      { name: "description", content: "Starte Challenges, mach mit, reich die Kette weiter." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-32 top-10 size-72 rounded-full blur-3xl" style={{ background: "var(--primary)" }} />
        <div className="absolute right-[-80px] top-1/3 size-80 rounded-full blur-3xl" style={{ background: "var(--accent)" }} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-14">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tight">
            Join<span className="text-primary">Us</span>
          </span>
          <Link to="/auth" className="tap text-sm text-muted-foreground hover:text-foreground">
            Anmelden
          </Link>
        </header>

        <main className="mt-12 flex-1">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Mitmachen statt zuschauen.
            <span className="block text-primary">Machen statt scrollen.</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Challenges starten, mitmachen, Beweis hochladen – Kette weiterreichen. <span className="text-foreground">Du bist dran.</span>
          </p>

          <div className="mt-10 space-y-3">
            <Feature icon={<Zap className="size-5" />} title="Daily Challenge" />
            <Feature icon={<Users className="size-5" />} title="Mit Freunden" />
            <Feature icon={<Link2 className="size-5" />} title="Die Kette" />
          </div>
        </main>

        <div className="mt-10 space-y-3">
          <Link
            to="/auth"
            className="tap group relative flex items-center justify-center overflow-hidden rounded-2xl bg-primary px-6 py-5 font-display text-lg font-bold tracking-tight text-primary-foreground transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_var(--primary)] active:scale-[0.98]"
          >
            <span className="absolute inset-0 opacity-0 transition-opacity duration-2000 group-hover:opacity-100" style={{ background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 20%), transparent)" }} />
            Loslegen →
          </Link>
          <p className="text-center text-[11px] text-muted-foreground/70">
            Privat · keine Fremd-DMs · kein Standorttracking
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <div className="font-display text-sm font-semibold">{title}</div>
    </div>
  );
}
