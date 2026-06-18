import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/groups")({
  head: () => ({ meta: [{ title: "Gruppen – JoinUs" }] }),
  component: Groups,
});

function Groups() {
  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-2xl font-bold">Gruppen</h1>
      <div className="mt-8 rounded-3xl border border-dashed border-border bg-surface p-8 text-center">
        <div className="text-4xl">👥</div>
        <h2 className="mt-3 font-display text-lg font-semibold">Bald verfügbar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Klasse, Crew, Familie, Verein – eigene Gruppen-Challenges und Ranglisten kommen als Nächstes.
        </p>
      </div>
    </div>
  );
}
