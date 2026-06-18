import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, Users, Link2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JoinUs – Machen statt scrollen" },
      { name: "description", content: "Herausforderungen annehmen, Beweise liefern und die Kette am Leben halten." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-72 rounded-full opacity-30 blur-[100px]" style={{ background: "var(--primary)" }} />
        <div className="absolute bottom-10 -right-20 size-80 rounded-full opacity-20 blur-[120px]" style={{ background: "var(--accent)" }} />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col gap-8 px-6 pb-10 pt-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="font-display text-2xl font-bold tracking-tighter">
            Join<span className="text-primary">Us</span>
          </div>
          <Link to="/auth" className="tap text-sm font-medium text-muted-foreground transition-opacity hover:text-foreground">
            Anmelden
          </Link>
        </header>

        <main className="flex flex-1 flex-col gap-10">
          {/* Hero claim */}
          <section className="space-y-4">
            <h1 className="font-display text-[56px] font-bold leading-[0.9] tracking-tight">
              Machen <br />
              <span className="text-primary">statt</span> <br />
              scrollen.
            </h1>
            <p className="max-w-[280px] text-base leading-relaxed text-muted-foreground">
              Herausforderungen annehmen, Beweise liefern und die Kette am Leben halten.
            </p>
          </section>

          {/* Bento features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="group relative col-span-2 flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-surface/60 p-5 transition-colors hover:border-accent">
              <div className="flex size-10 items-center justify-center rounded-full text-accent" style={{ background: "color-mix(in oklab, var(--accent) 12%, transparent)" }}>
                <Zap className="size-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Daily Challenge</h3>
                <p className="text-sm text-muted-foreground">Jeden Tag eine neue Tat.</p>
              </div>
              <div className="pointer-events-none absolute -bottom-4 -right-4 size-24 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-20" style={{ background: "var(--accent)" }} />
            </div>

            <div className="group flex flex-col gap-3 rounded-3xl border border-border bg-surface/60 p-5 transition-colors hover:border-primary">
              <Users className="size-6 text-primary" strokeWidth={2} />
              <span className="font-display text-lg font-bold">Freunde</span>
            </div>

            <div className="group flex flex-col gap-3 rounded-3xl border border-border bg-surface/60 p-5 transition-colors hover:border-foreground/40">
              <Link2 className="size-6 text-muted-foreground" strokeWidth={2} />
              <span className="font-display text-lg font-bold">Die Kette</span>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-auto pt-4">
            <Link
              to="/auth"
              className="tap flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-5 font-display text-xl font-bold text-primary-foreground shadow-[0_20px_40px_-10px_color-mix(in_oklab,var(--primary)_40%,transparent)] transition-transform hover:scale-[1.02] active:scale-95"
            >
              Loslegen
              <ArrowRight className="size-6" strokeWidth={2.5} />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
