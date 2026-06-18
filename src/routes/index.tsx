import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Zap, Users, Link2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JoinUs – Mitmachen statt zuschauen" },
      { name: "description", content: "Starte Challenges, mach mit, reich die Kette weiter. Die Mitmach-App für deine Crew." },
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
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Anmelden
          </Link>
        </header>

        <main className="mt-14 flex-1">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Mitmachen statt zuschauen.
            <span className="block text-primary">Machen statt scrollen.</span>
          </h1>
          <p className="mt-5 text-base text-muted-foreground">
            JoinUs ist kein Feed. Jemand startet eine Challenge, du machst mit, lädst deinen Beweis hoch – und reichst die Kette weiter. <span className="text-foreground">Du bist dran.</span>
          </p>

          <div className="mt-10 space-y-3">
            <Feature icon={<Zap className="size-5" />} title="Daily Challenge" body="Eine handverlesene Challenge pro Tag. Routine ohne Stress." />
            <Feature icon={<Users className="size-5" />} title="Mit Freunden" body="Sieh sofort, wer aus deiner Crew gerade mitmacht." />
            <Feature icon={<Link2 className="size-5" />} title="Die Kette" body="Wer abschließt, startet die nächste. Staffelstab statt Like." />
          </div>
        </main>

        <div className="mt-10 space-y-3">
          <Link
            to="/auth"
            className="tap flex items-center justify-center rounded-2xl bg-primary px-5 py-4 font-display text-base font-semibold text-primary-foreground glow-primary"
          >
            Loslegen
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            Privat als Standard · keine offenen DMs mit Fremden · kein Personenstandort
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <div>
        <div className="font-display text-sm font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}
