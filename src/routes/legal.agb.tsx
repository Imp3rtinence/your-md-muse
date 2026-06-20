import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/agb")({
  head: () => ({
    meta: [
      { title: "AGB – Komma" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen der Komma-App, betrieben von der Gotham Consulting GmbH." },
    ],
  }),
  component: AgbPage,
});

function AgbPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("legal.back")}
        </Link>

        <header>
          <h1 className="font-display text-3xl font-bold leading-tight">Allgemeine Geschäftsbedingungen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stand: Juni 2026 · gültig für die App „Komma"</p>
        </header>

        <Section title="1. Geltungsbereich und Anbieter">
          <p>
            Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für die Nutzung der mobilen Anwendung und der Web-Plattform
            „Komma" (nachfolgend „App") der <strong>Gotham Consulting GmbH</strong>, Rosenweg 4, 99820 Hörselberg-Hainich
            (nachfolgend „Anbieter"). Mit der Registrierung erklärst du dich mit diesen AGB einverstanden.
          </p>
        </Section>

        <Section title="2. Leistungsbeschreibung">
          <p>
            Komma ist eine soziale Mitmach-Plattform, auf der Nutzer:innen Challenges erstellen, daran teilnehmen, Beweise hochladen,
            Crews gründen und sich austauschen können. Teile der Inhalte und Vorschläge werden durch künstliche Intelligenz erzeugt und
            sind als solche gekennzeichnet (z. B. Community-Bots).
          </p>
        </Section>

        <Section title="3. Registrierung und Mindestalter">
          <p>
            Zur Nutzung ist ein kostenloses Nutzerkonto erforderlich. Die Nutzung ist Personen ab dem vollendeten 14. Lebensjahr gestattet.
            Bei Minderjährigen wird die Zustimmung der Erziehungsberechtigten vorausgesetzt. Du bist verpflichtet, wahrheitsgemäße Angaben
            zu machen und dein Konto vor fremdem Zugriff zu schützen.
          </p>
        </Section>

        <Section title="4. Nutzerinhalte und Rechteeinräumung">
          <p>
            Für selbst erstellte Inhalte (Challenges, Beweise, Kommentare, Bilder, Videos, Texte) bleibst du Urheber:in. Du räumst dem
            Anbieter ein einfaches, weltweites, unentgeltliches Nutzungsrecht zur Speicherung, Wiedergabe und Anzeige innerhalb der App
            und ihrer Funktionen ein, soweit dies für den Betrieb erforderlich ist. Du sicherst zu, dass du an deinen Inhalten alle
            erforderlichen Rechte hältst und keine Rechte Dritter verletzt.
          </p>
        </Section>

        <Section title="5. Verhaltensregeln">
          <p>Verboten ist insbesondere das Hochladen oder Verbreiten von Inhalten, die</p>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>gegen geltendes Recht verstoßen,</li>
            <li>Rechte Dritter verletzen (z. B. Urheber-, Marken- oder Persönlichkeitsrechte),</li>
            <li>gewaltverherrlichend, diskriminierend, pornografisch oder jugendgefährdend sind,</li>
            <li>andere Nutzer:innen belästigen, bedrohen oder zu Straftaten anleiten,</li>
            <li>Schadsoftware enthalten oder die Sicherheit der App beeinträchtigen.</li>
          </ul>
          <p>
            Der Anbieter behält sich vor, Inhalte zu entfernen und Konten bei Verstößen zu sperren.
          </p>
        </Section>

        <Section title="6. Direktnachrichten und Verschlüsselung">
          <p>
            Direktnachrichten zwischen Nutzer:innen werden in der Datenbank verschlüsselt gespeichert (Server-seitige Verschlüsselung at
            rest). Eine Ende-zu-Ende-Verschlüsselung erfolgt nicht; der Anbieter kann Nachrichten zur Erfüllung gesetzlicher
            Verpflichtungen oder zur Aufklärung von Missbrauch in begründeten Einzelfällen entschlüsseln.
          </p>
        </Section>

        <Section title="7. KI-generierte Inhalte">
          <p>
            Bestimmte Inhalte (Challenges, Vorschläge, Übersetzungen, Coverbilder, Wochenrückblicke, Badges) werden ganz oder teilweise
            durch KI erstellt. Solche Inhalte können Fehler enthalten und ersetzen keine fachliche oder rechtliche Beratung. Eine Haftung
            für die Richtigkeit, Aktualität oder Vollständigkeit KI-generierter Inhalte ist ausgeschlossen.
          </p>
        </Section>

        <Section title="8. Verfügbarkeit">
          <p>
            Der Anbieter ist um eine möglichst hohe Verfügbarkeit bemüht, schuldet diese aber nicht. Wartungsarbeiten, Störungen Dritter
            oder höhere Gewalt können zu vorübergehenden Einschränkungen führen.
          </p>
        </Section>

        <Section title="9. Haftung">
          <p>
            Der Anbieter haftet uneingeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach dem Produkthaftungsgesetz. Für leichte
            Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und begrenzt auf den
            typischerweise vorhersehbaren Schaden. Eine weitergehende Haftung ist ausgeschlossen.
          </p>
        </Section>

        <Section title="10. Kündigung">
          <p>
            Du kannst dein Konto jederzeit über die Profil-Einstellungen löschen. Der Anbieter ist berechtigt, das Nutzungsverhältnis bei
            schwerwiegenden Verstößen gegen diese AGB außerordentlich zu kündigen.
          </p>
        </Section>

        <Section title="11. Änderungen der AGB">
          <p>
            Der Anbieter darf diese AGB anpassen, soweit dies aus rechtlichen oder technischen Gründen erforderlich ist. Änderungen werden
            in der App angezeigt. Widersprichst du nicht innerhalb von vier Wochen, gelten die geänderten AGB als angenommen.
          </p>
        </Section>

        <Section title="12. Schlussbestimmungen">
          <p>
            Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Ist eine Bestimmung dieser AGB unwirksam, bleibt die Wirksamkeit
            der übrigen Bestimmungen unberührt. Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des Anbieters.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground">
          Bei Fragen zu diesen AGB wende dich bitte an die im <Link to="/legal/impressum" className="text-primary underline-offset-2 hover:underline">Impressum</Link> genannten Kontaktdaten.
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
