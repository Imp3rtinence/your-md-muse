import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAvatarUrl } from "@/lib/avatar-url";
import { LEAGUES, getLeague, msUntilWeekEnd, formatCountdown, PROMOTION_COUNT, DEMOTION_COUNT } from "@/lib/leagues";
import { ChevronLeft, ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { LeagueBadge } from "@/components/LeagueBadge";

export const Route = createFileRoute("/_app/league")({
  head: () => ({ meta: [{ title: "Liga – JoinUs" }] }),
  component: LeaguePage,
});

function LeaguePage() {
  const { profile, user } = useAuth();
  const tier = profile?.league_tier ?? 1;
  const league = getLeague(tier);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(i);
  }, []);
  const remaining = msUntilWeekEnd(new Date(now));

  const { data: leaderboard } = useQuery({
    queryKey: ["league-leaderboard", tier],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("id,username,display_name,avatar_url,weekly_aura,aura,league_tier")

        .eq("league_tier", tier)
        .order("weekly_aura", { ascending: false })
        .order("aura", { ascending: false })
        .limit(30);
      return (data ?? []) as Array<{
        id: string; username: string; display_name: string | null;
        avatar_url: string | null; weekly_aura: number; aura: number; league_tier: number;
      }>;
    },
  });

  const myRank = leaderboard?.findIndex((p) => p.id === user?.id) ?? -1;
  const total = leaderboard?.length ?? 0;

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/profile" className="tap flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Profil
        </Link>
        <div className="text-xs text-muted-foreground">Endet in {formatCountdown(remaining)}</div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(circle at 50% 0%, ${league.glow}, transparent 60%)` }}
        />
        <div className="relative flex flex-col items-center text-center">
          <LeagueBadge tier={tier} size={120} />
          <div className={`mt-3 font-display text-3xl font-bold ${league.color}`}>{league.name}</div>
          <div className="mt-1 text-sm text-muted-foreground">Liga {tier} von 8</div>
          <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-sm">
            <Trophy className="size-4 text-accent" />
            <span className="font-semibold">{profile?.weekly_aura ?? 0}</span>
            <span className="text-muted-foreground">Aura diese Woche</span>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center gap-1 text-emerald-400"><ArrowUp className="size-3.5" /> Aufstieg</div>
          <div className="mt-1 text-muted-foreground">Top {PROMOTION_COUNT} steigen auf</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center gap-1 text-rose-400"><ArrowDown className="size-3.5" /> Abstieg</div>
          <div className="mt-1 text-muted-foreground">Bottom {DEMOTION_COUNT} steigen ab</div>
        </div>
      </div>

      {/* Leaderboard */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Leaderboard</h2>
          {myRank >= 0 && (
            <span className="text-xs text-muted-foreground">Platz {myRank + 1} von {total}</span>
          )}
        </div>
        {leaderboard?.length ? (
          <ol className="space-y-1.5">
            {leaderboard.map((p, idx) => {
              const rank = idx + 1;
              const isPromo = tier < 8 && rank <= PROMOTION_COUNT;
              const isDemo = tier > 1 && rank > total - DEMOTION_COUNT;
              const isMe = p.id === user?.id;
              return (
                <LeaderRow
                  key={p.id}
                  rank={rank}
                  zone={isPromo ? "promo" : isDemo ? "demo" : "safe"}
                  isMe={isMe}
                  row={p}
                />
              );
            })}
          </ol>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-sm text-muted-foreground">
            Noch niemand in deiner Liga aktiv. Sammle Aura, um die Tabelle zu starten.
          </div>
        )}

        {/* Zone legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Aufstieg</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted-foreground" /> Halten</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-rose-500" /> Abstieg</span>
        </div>
      </section>

      {/* All leagues overview */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">Alle Ligen</h2>
        <ul className="grid grid-cols-4 gap-2">
          {LEAGUES.map((l) => {
            const active = l.tier === tier;
            return (
              <li
                key={l.tier}
                className={`flex flex-col items-center rounded-2xl border p-2 ${active ? "border-primary bg-surface" : "border-border bg-surface/60 opacity-70"}`}
              >
                <LeagueBadge tier={l.tier} size={48} />
                <div className={`mt-1 text-[11px] font-semibold ${l.color}`}>{l.name}</div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function LeaderRow({
  rank, zone, isMe, row,
}: {
  rank: number;
  zone: "promo" | "safe" | "demo";
  isMe: boolean;
  row: { id: string; username: string; display_name: string | null; avatar_url: string | null; weekly_aura: number };
}) {
  const avatar = useAvatarUrl(row.avatar_url);
  const dot =
    zone === "promo" ? "bg-emerald-500" : zone === "demo" ? "bg-rose-500" : "bg-muted-foreground";
  const ZoneIcon = zone === "promo" ? ArrowUp : zone === "demo" ? ArrowDown : Minus;
  const zoneColor = zone === "promo" ? "text-emerald-400" : zone === "demo" ? "text-rose-400" : "text-muted-foreground";

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${isMe ? "border-primary bg-primary/10" : "border-border bg-surface"}`}
    >
      <div className="flex w-7 items-center justify-center text-sm font-semibold tabular-nums">
        {rank}
      </div>
      <span className={`size-1.5 rounded-full ${dot}`} />
      <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {avatar ? (
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs font-semibold">
            {(row.username ?? "??").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {row.display_name ?? row.username} {isMe && <span className="text-xs text-primary">(du)</span>}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">@{row.username}</div>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold tabular-nums">
        {row.weekly_aura}
        <ZoneIcon className={`size-3.5 ${zoneColor}`} />
      </div>
    </li>
  );
}
