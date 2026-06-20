import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categoryMeta } from "@/lib/categories";
import { getMyAiProfile } from "@/lib/ai/onboarding.functions";
import { searchChallenges } from "@/lib/ai/embeddings.functions";
import { Flame, Loader2, MapPin, Search, Sparkles, Users as UsersIcon, Wand2 } from "lucide-react";
import { BotBadge } from "@/components/BotBadge";
import { useProofUrl } from "@/lib/proof-url";
import { AdSlot, AD_SLOTS } from "@/components/AdSlot";
import { useTrackLocation } from "@/lib/use-location";
import { useDragScroll } from "@/lib/use-drag-scroll";

export const Route = createFileRoute("/_app/home")({
  head: () => ({ meta: [{ title: "Home – Komma" }] }),
  component: Home,
});

type Challenge = {
  id: string; title: string; description: string | null;
  category: string; visibility: string;
  participant_count: number; created_at: string; is_daily?: boolean;
  creator_id: string;
  hero_image_url: string | null;
  difficulty?: string | null;
  distance_km?: number | null;
  creator?: { username: string; display_name: string | null; avatar_url: string | null; is_ai_bot?: boolean };
};

function Home() {
  const { profile } = useAuth();
  const fetchAi = useServerFn(getMyAiProfile);
  useTrackLocation();

  const { data: aiProfile } = useQuery({
    queryKey: ["my-ai-profile"],
    queryFn: () => fetchAi(),
    staleTime: 60_000,
    retry: false,
  });

  const { data: feed, isLoading } = useQuery({
    queryKey: ["home-feed-nearby"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("nearby_challenges", { _target: 20 });
      if (error) throw error;
      const list = (data ?? []) as Challenge[];
      if (list.length === 0) return [] as Challenge[];
      const ids = Array.from(new Set(list.map((c) => c.creator_id)));
      const { data: creators } = await (supabase as any)
        .from("profiles")
        .select("id,username,display_name,avatar_url,is_ai_bot")
        .in("id", ids);
      const byId = new Map((creators ?? []).map((p: any) => [p.id, p]));
      return list.map((c) => ({ ...c, creator: byId.get(c.creator_id) as Challenge["creator"] })) as Challenge[];
    },
  });

  const challenges = feed ?? [];
  const maxDist = challenges.reduce((m, c) => Math.max(m, c.distance_km ?? 0), 0);
  const daily = challenges[0];
  const trending = [...challenges].sort((a, b) => b.participant_count - a.participant_count).slice(0, 8);
  const fresh = challenges.slice(0, 8);

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

      <SmartSearch />

      <WeeklyRecap />

      {challenges.length > 0 && maxDist > 0 && (
        <div className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          <span>Die {challenges.length} nächsten Challenges um dich – Umkreis ~{Math.ceil(maxDist)} km</span>
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 h-56 animate-pulse rounded-3xl bg-surface" />
      ) : daily ? (
        <DailyHero c={daily} />
      ) : (
        <EmptyState />
      )}

      <ForYouSection ai={aiProfile} />

      <Section title="🔥 Trending" items={trending} />
      <AdSlot slot={AD_SLOTS.feed} variant="feed" className="mt-6" />
      <Section title="🆕 Neu" items={fresh} />
    </div>
  );
}

function ForYouSection({ ai }: { ai: any }) {
  if (!ai || !ai.suggested_challenges?.length) return null;
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="size-4 text-primary" />
        <h3 className="font-display text-lg font-semibold">Für dich gestartet</h3>
      </div>
      {ai.summary && <p className="mb-3 text-sm text-muted-foreground">{ai.summary}</p>}
      <ForYouRow items={ai.suggested_challenges} />
    </section>
  );
}

function ForYouRow({ items }: { items: any[] }) {
  const { ref, handlers } = useDragScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      {...handlers}
      className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((s: any, i: number) => {
          const cat = categoryMeta(s.category);
          return (
            <Link
              key={i}
              to="/create"
              className="block w-64 shrink-0 rounded-2xl border border-primary/30 bg-primary/5 p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-3" /> KI-Vorschlag
              </div>
              <div className="mt-2 line-clamp-2 font-display text-base font-semibold">{s.title}</div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</div>
              <div className="mt-3 text-xs">{cat.icon} {cat.label} · {s.duration_minutes} Min</div>
            </Link>
          );
        })}
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
  const { ref, handlers } = useDragScroll<HTMLDivElement>();
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>
      <div
        ref={ref}
        {...handlers}
        className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((c) => <ChallengeCard key={c.id} c={c} />)}
      </div>
    </section>
  );
}

function ChallengeCard({ c }: { c: Challenge }) {
  const cat = categoryMeta(c.category);
  const heroUrl = useProofUrl(c.hero_image_url);
  return (
    <Link
      to="/challenge/$id" params={{ id: c.id }}
      className="block w-56 shrink-0 overflow-hidden rounded-2xl border border-border gradient-card"
    >
      {heroUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
          <img src={heroUrl} alt="" className="size-full object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-background/70 px-1.5 py-0.5 text-sm backdrop-blur">{cat.icon}</span>
        </div>
      ) : null}
      <div className="p-4">
        {!heroUrl && <div className="text-2xl">{cat.icon}</div>}
        <div className={`${heroUrl ? "" : "mt-2"} line-clamp-2 font-display text-base font-semibold`}>{c.title}</div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            @{c.creator?.username ?? "…"}
            {c.creator?.is_ai_bot && <BotBadge size="xs" />}
          </span>
          <span className="flex items-center gap-1"><UsersIcon className="size-3" />{c.participant_count}</span>
        </div>
      </div>
    </Link>
  );
}

function SmartSearch() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const search = useServerFn(searchChallenges);
  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) { setResults(null); return; }
    setBusy(true);
    try {
      const r = await search({ data: { query: q.trim() } });
      setResults(r as any[]);
    } catch { setResults([]); }
    finally { setBusy(false); }
  };
  return (
    <section className="mt-5">
      <form onSubmit={run} className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Idee, Stimmung oder Stichwort…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(""); setResults(null); }}
            className="text-xs text-muted-foreground"
          >
            ×
          </button>
        )}
        <button type="submit" disabled={busy || !q.trim()} className="tap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="size-3 animate-spin" /> : "Suchen"}
        </button>
      </form>
      {results && (
        <div className="mt-2 space-y-1.5">
          {results.length === 0 && <p className="text-xs text-muted-foreground">Nichts Passendes gefunden.</p>}
          {results.map((r) => (
            <Link key={r.id} to="/challenge/$id" params={{ id: r.id }} className="tap flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm">
              <span className="line-clamp-1">{r.title}</span>
              <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{Math.round((r.similarity ?? 0) * 100)}% match</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function WeeklyRecap() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["weekly-recap", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("weekly_recaps")
        .select("summary, suggestion, stats, week_start")
        .eq("user_id", user!.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60_000,
  });
  if (!data) return null;
  const stats = (data.stats ?? {}) as any;
  return (
    <section className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary">
        <Sparkles className="size-3" /> Deine Woche
      </div>
      <p className="text-sm font-medium">{data.summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">→ {data.suggestion}</p>
      {(stats.aura || stats.events) && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {stats.events ? `${stats.events} Aktionen` : ""}{stats.events && stats.aura ? " · " : ""}{stats.aura ? `+${stats.aura} Aura` : ""}
        </div>
      )}
    </section>
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
