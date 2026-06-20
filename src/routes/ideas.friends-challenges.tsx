import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, Users, Sparkles, Flag, Timer, MapPin, Music, Utensils, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/ideas/friends-challenges")({
  head: () => ({
    meta: [
      { title: "20 Challenges to Do With Friends – Komma" },
      {
        name: "description",
        content:
          "Kuratierte Liste von Mitmach-Challenges für Freunde: 3-Sekunden-Tutorial, Foto-Schnitzeljagd, Karaoke-Battle und mehr. Sofort loslegen mit deiner Crew.",
      },
      { property: "og:title", content: "20 Challenges to Do With Friends – Komma" },
      {
        property: "og:description",
        content: "Lustige Gruppen-Challenges für Freunde: vom 3-Sekunden-Tutorial bis zur Foto-Schnitzeljagd.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://komma.fun/ideas/friends-challenges" },
    ],
    links: [{ rel: "canonical", href: "https://komma.fun/ideas/friends-challenges" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "20 Challenges to Do With Friends",
          description:
            "Kuratierte Liste von Mitmach-Challenges für Freundesgruppen.",
          author: { "@type": "Organization", name: "Komma" },
          publisher: { "@type": "Organization", name: "Komma" },
          mainEntityOfPage: "https://komma.fun/ideas/friends-challenges",
        }),
      },
    ],
  }),
  component: IdeasPage,
});

type Idea = { icon: React.ReactNode; title: string; desc: string };

const IDEAS: Idea[] = [
  { icon: <Timer className="size-4" />, title: "3-Sekunden-Tutorial", desc: "Erklärt etwas Nützliches in genau drei Sekunden – wer kondensiert am besten?" },
  { icon: <Camera className="size-4" />, title: "Foto-Schnitzeljagd", desc: "Findet zehn Objekte aus einer geheimen Liste in unter einer Stunde." },
  { icon: <Music className="size-4" />, title: "Karaoke-Battle", desc: "Jede:r singt 30 Sekunden eines zufällig gezogenen Songs – Crew stimmt ab." },
  { icon: <Utensils className="size-4" />, title: "5-Zutaten-Kochen", desc: "Kocht ein Gericht mit nur fünf Zutaten und teilt das Ergebnis." },
  { icon: <MapPin className="size-4" />, title: "Lokaler Geheimtipp", desc: "Zeigt einen Ort in eurer Stadt, den die anderen noch nicht kennen." },
  { icon: <MessageCircle className="size-4" />, title: "Fremde grüßen", desc: "Macht zehn echten Menschen heute ein ehrliches Kompliment." },
  { icon: <Sparkles className="size-4" />, title: "30-Tage-Skill", desc: "Lernt einen kleinen Skill in 30 Tagen – täglicher Mini-Beweis." },
  { icon: <Camera className="size-4" />, title: "Outfit-Swap", desc: "Tauscht für einen Tag das Outfit mit jemandem aus der Crew." },
  { icon: <Flag className="size-4" />, title: "No-Screen-Sonntag", desc: "Ein ganzer Tag ohne Handy – wer hält durch und liefert den Beweis?" },
  { icon: <Users className="size-4" />, title: "Random Acts of Kindness", desc: "Macht eine konkrete gute Tat und reicht die Challenge weiter." },
];

function IdeasPage() {
  return (
    <div className="min-h-[100dvh] bg-background px-5 py-10 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Inspiration</p>
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Challenges to do with friends – 10 Ideen, die sofort funktionieren
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Du suchst Mitmach-Ideen für deine Crew? Hier sind zehn kuratierte Challenges, die du heute starten kannst.
            Wähle eine, schicke sie an Freunde und reicht die Kette weiter – auf Komma sammelt ihr nebenbei Aura und Badges.
          </p>
        </header>

        <ol className="space-y-3">
          {IDEAS.map((idea, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
                {idea.icon}
              </span>
              <div>
                <h2 className="font-display text-base font-semibold">
                  <span className="text-muted-foreground">{i + 1}.</span> {idea.title}
                </h2>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">{idea.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="rounded-2xl border border-border bg-surface/60 p-5">
          <h2 className="font-display text-lg font-semibold">So funktioniert eine Challenge auf Komma</h2>
          <ol className="mt-2 space-y-1 text-sm text-foreground/85">
            <li>1. <strong>Starten:</strong> Wähle eine Idee und lade deine Freunde ein.</li>
            <li>2. <strong>Beweisen:</strong> Jede:r lädt ein kurzes Foto oder Video hoch.</li>
            <li>3. <strong>Weiterreichen:</strong> Gib die Challenge an die nächste Crew weiter.</li>
          </ol>
        </section>

        <div className="pt-2">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-display font-semibold text-primary-foreground"
          >
            Eigene Challenge starten <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
