import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BadgeArt } from "@/components/BadgeArt";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_app/badges")({
  head: () => ({ meta: [{ title: "Abzeichen-Regal – Komma" }] }),
  component: BadgesPage,
});

function BadgesPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const { data: all } = useQuery({
    queryKey: ["badges-all"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("badges")
        .select("slug,name,description")
        .order("slug");
      return data ?? [];
    },
  });

  const { data: mine } = useQuery({
    queryKey: ["badges-mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_badges")
        .select("badge_slug, awarded_at")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const owned = new Map<string, string>((mine ?? []).map((b: any) => [b.badge_slug, b.awarded_at]));
  const ownedCount = owned.size;
  const total = all?.length ?? 0;

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <button onClick={() => nav({ to: "/profile" })} className="tap -ml-2 text-muted-foreground">
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold leading-none">Abzeichen-Regal</h1>
          <div className="mt-0.5 text-xs text-muted-foreground">{ownedCount} von {total} gesammelt</div>
        </div>
      </header>

      <div className="px-5 pt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: total ? `${(ownedCount / total) * 100}%` : "0%" }}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {all?.map((b: any) => {
            const have = owned.has(b.slug);
            const awarded = owned.get(b.slug);
            return (
              <div
                key={b.slug}
                className={
                  "flex flex-col items-center rounded-3xl border p-4 text-center transition " +
                  (have
                    ? "border-accent/40 bg-surface shadow-[0_0_24px_-12px_hsl(var(--accent)/0.6)]"
                    : "border-border bg-surface/60")
                }
              >
                <BadgeArt slug={b.slug} locked={!have} size={96} />
                <div className={"mt-3 font-display text-sm font-semibold " + (have ? "" : "text-muted-foreground")}>
                  {b.name}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {b.description}
                </div>
                {have && awarded && (
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-accent">
                    Erhalten {new Date(awarded).toLocaleDateString("de-DE")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
