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

type Section = { title: string; body: string[] };

function ImpressumPage() {
  const { t } = useTranslation();
  const sections = (t("legal.impressum.sections", { returnObjects: true }) as Section[]) || [];

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-8 text-foreground">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {t("legal.back")}
        </Link>

        <header>
          <h1 className="font-display text-3xl font-bold leading-tight">{t("legal.impressum.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("legal.impressum.subtitle")}</p>
        </header>

        {sections.map((s, i) => (
          <section key={i} className="space-y-2">
            <h2 className="font-display text-lg font-semibold">{s.title}</h2>
            <div className="space-y-1 text-sm leading-relaxed text-foreground/90">
              {s.body.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          {t("legal.impressum.seeAlso", { terms: t("legal.agb.title") })
            .split("{{terms}}")[0]}
          <Link to="/legal/agb" className="text-primary underline-offset-2 hover:underline">
            {t("legal.agb.title")}
          </Link>
          {t("legal.impressum.seeAlso", { terms: "" }).split("{{terms}}").pop()?.replace("{{terms}}", "")}
        </p>
      </div>
    </div>
  );
}
