import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal/agb")({
  head: () => ({
    meta: [
      { title: "AGB – Komma" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen der Komma-App, betrieben von der Gotham Consulting GmbH. Rechte, Pflichten und Nutzungsregeln." },
      { property: "og:title", content: "AGB – Komma" },
      { property: "og:description", content: "Allgemeine Geschäftsbedingungen der Komma-App, Gotham Consulting GmbH." },
      { property: "og:url", content: "https://komma.fun/legal/agb" },
    ],
    links: [{ rel: "canonical", href: "https://komma.fun/legal/agb" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Gotham Consulting GmbH",
          url: "https://komma.fun/",
          brand: "Komma",
        }),
      },
    ],
  }),
  component: AgbPage,
});


type Section = { title: string; body: string[]; list?: string[] };

function AgbPage() {
  const { t } = useTranslation();
  const sections = (t("legal.agb.sections", { returnObjects: true }) as Section[]) || [];
  const authoritative = t("legal.agb.authoritative", { defaultValue: "" });

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("legal.back")}
        </Link>

        <header>
          <h1 className="font-display text-3xl font-bold leading-tight">{t("legal.agb.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("legal.agb.updated")}</p>
        </header>

        {authoritative ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {authoritative}
          </div>
        ) : null}

        {sections.map((s, i) => (
          <Section key={i} title={s.title}>
            {s.body.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
            {s.list && s.list.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {s.list.map((li, k) => (
                  <li key={k}>{li}</li>
                ))}
              </ul>
            ) : null}
          </Section>
        ))}

        <ContactLine />
      </div>
    </div>
  );
}

function ContactLine() {
  const { t } = useTranslation();
  const template = t("legal.agb.contact", { defaultValue: "Imprint: {{imprint}}" });
  const [before, after = ""] = template.split("{{imprint}}");
  return (
    <p className="text-xs text-muted-foreground">
      {before}
      <Link to="/legal/impressum" className="text-primary underline-offset-2 hover:underline">
        {t("legal.impressum.title")}
      </Link>
      {after}
    </p>
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
