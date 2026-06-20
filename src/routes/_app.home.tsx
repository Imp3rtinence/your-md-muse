import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categoryMeta } from "@/lib/categories";
import { Flame, Sparkles, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home – Komma" }] }),
  component: Home,
});

type Challenge = {
  id: string; title: string; description: string | null;
  category: string; visibility: string;
  participant_count: number; created_at: string; is_daily: boolean;
  creator_id: string;
  creator?: { username: string; display_name: string | null; avatar_url: string | null };
};

function Home() {
  const { profile } = useAuth();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["home-feed"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("challenges")
        .select("*, creator:profiles!challenges_creator_id_fkey(username,display_name,avatar_url)")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as Challenge[];
    },
  });

  const daily = challenges?.find((c) => c.is_daily) ?? challenges?.[0];
  const trending = (challenges ?? [])
    .filter((c) => c.id !== daily?.id)
    .sort((a, b) => b.participant_count - a.participant_count)
    .slice(0, 8);
  const fresh = (challenges ?? []).filter((c) => c.id !== daily?.id).slice(0, 8);

  return (
    <div className="px-5 pb-6 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Hey {profile?.display_name ?? profile?.username}</div>
          <h1 className="font-display text-2xl font-bold">Was machst du heute?</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5">
          <Sparkles className="size-4 text-accent" />
          <span className="font-display text-sm font-semibold">{profile?.aura ?? 0}</span>
          <span className="text-xs text-muted-foreground">Aura</span>
        </div>
      </header>

      {isLoading ? (
        <div className="mt-8 h-56 animate-pulse rounded-3xl bg-surface" />
      ) : daily ? (
        <DailyHero c={daily} />
      ) : (
        <EmptyState />
      )}

      <Section title="🔥 Trending" items={trending} />
      <Section title="🆕 Neu" items={fresh} />
    </div>
  );
}

function DailyHero({ c }: { c: Challenge }) {
  const cat = categoryMeta(c.category);
  return (
    <Link to="/challenge/$id" params={{ id: c.id }} className="mt-5 block">
      <div className="relative overflow-hidden rounded-3xl p-5 gradient-hero glow-primary">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/85">
          <Flame className="size-4" /> Daily Challenge
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-primary-foreground">
          {c.title}
        </h2>
        {c.description && <p className="mt-1 line-clamp-2 text-sm text-primary-foreground/85">{c.description}</p>}
        <div className="mt-4 flex items-center justify-between">
          <span className="rounded-full bg-background/30 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
            {cat.icon} {cat.label}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-primary-foreground">
            <UsersIcon className="size-4" /> {c.participant_count} dabei
          </span>
        </div>
      </div>
    </Link>
  );
}

function Section({ title, items }: { title: string; items: Challenge[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((c) => <ChallengeCard key={c.id} c={c} />)}
      </div>
    </section>
  );
}

function ChallengeCard({ c }: { c: Challenge }) {
  const cat = categoryMeta(c.category);
  return (
    <Link
      to="/challenge/$id" params={{ id: c.id }}
      className="block w-56 shrink-0 rounded-2xl border border-border gradient-card p-4"
    >
      <div className="text-2xl">{cat.icon}</div>
      <div className="mt-2 line-clamp-2 font-display text-base font-semibold">{c.title}</div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>@{c.creator?.username ?? "…"}</span>
        <span className="flex items-center gap-1"><UsersIcon className="size-3" />{c.participant_count}</span>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-border bg-surface p-8 text-center">
      <div className="text-4xl">🎯</div>
      <h3 className="mt-3 font-display text-lg font-semibold">Noch keine Challenges</h3>
      <p className="mt-1 text-sm text-muted-foreground">Sei der/die Erste – starte eine Challenge und reich die Kette weiter.</p>
      <Link to="/create" className="tap mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
        Challenge starten
      </Link>
    </div>
  );
}
