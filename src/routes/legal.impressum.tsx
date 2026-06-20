import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum – Komma" },
      { name: "description", content: "Impressum und Anbieterkennzeichnung der Komma-App – Gotham Consulting GmbH." },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("legal.back")}
        </Link>

        <header>
          <h1 className="font-display text-3xl font-bold leading-tight">Impressum</h1>
          <p className="mt-1 text-sm text-muted-foreground">Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz) und § 18 MStV</p>
        </header>

        <Section title="Anbieter">
          <p>
            <strong>Gotham Consulting GmbH</strong>
            <br />
            Rosenweg 4
            <br />
            99820 Hörselberg-Hainich
            <br />
            Deutschland
          </p>
        </Section>

        <Section title="Vertretungsberechtigte">
          <p>Vertreten durch die Geschäftsführung der Gotham Consulting GmbH.</p>
        </Section>

        <Section title="Kontakt">
          <p>
            E-Mail: <a className="text-primary underline-offset-2 hover:underline" href="mailto:hallo@komma.app">hallo@komma.app</a>
          </p>
        </Section>

        <Section title="Registereintrag">
          <p>Eintragung im Handelsregister beim zuständigen Amtsgericht. Die genaue Registernummer wird auf Anfrage mitgeteilt.</p>
        </Section>

        <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          <p>Gotham Consulting GmbH, Rosenweg 4, 99820 Hörselberg-Hainich</p>
        </Section>

        <Section title="EU-Streitschlichtung">
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a className="text-primary underline-offset-2 hover:underline" href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a>
            . Wir sind nicht bereit oder verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </Section>

        <Section title="Haftung für Inhalte">
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
            verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
            fremde Informationen zu überwachen.
          </p>
        </Section>

        <Section title="Haftung für Links">
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für deren Inhalte ist
            stets der jeweilige Anbieter verantwortlich.
          </p>
        </Section>

        <Section title="Urheberrecht">
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
            Nutzer-generierte Inhalte verbleiben bei den jeweiligen Urheber:innen.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground">
          Siehe auch unsere <Link to="/legal/agb" className="text-primary underline-offset-2 hover:underline">AGB</Link>.
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
