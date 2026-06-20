import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAvatarUrl } from "@/lib/avatar-url";
import { AvatarEditor } from "@/components/AvatarEditor";
import { BadgeArt } from "@/components/BadgeArt";
import { LeagueBadge } from "@/components/LeagueBadge";
import { PillButton } from "@/components/ActionTile";
import { getLeague, msUntilWeekEnd, formatCountdown } from "@/lib/leagues";
import { toast } from "sonner";
import { Sparkles, Flame, LogOut, Camera, ChevronRight, Languages, FileText, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profil – Komma" }] }),
  component: Profile,
});

function Profile() {
  const { profile, user, signOut, refreshProfile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Bis bald!");
  };
  const [editorOpen, setEditorOpen] = useState(false);
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const { data: badges } = useQuery({
    queryKey: ["badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_badges")
        .select("awarded_at, badge:badges(slug,name,description,icon)")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const { data: myChallenges } = useQuery({
    queryKey: ["my-challenges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("challenges").select("id,title,category,participant_count,created_at,expires_at")
        .eq("creator_id", user!.id).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => setEditorOpen(true)}
            className="tap relative size-20 overflow-hidden rounded-3xl bg-primary text-2xl font-display font-bold text-primary-foreground glow-primary"
            aria-label="Profilbild bearbeiten"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center">
                {(profile?.username ?? "??").slice(0,2).toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-0 right-0 m-1 grid size-6 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur">
              <Camera className="size-3.5" />
            </span>
          </button>
          <h1 className="mt-4 font-display text-2xl font-bold">{profile?.display_name ?? profile?.username}</h1>
          <div className="text-sm text-muted-foreground">@{profile?.username} · privat</div>
        </div>
        <button onClick={handleSignOut} className="tap rounded-full border border-border p-2 text-muted-foreground">
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat icon={<Sparkles className="size-4 text-accent" />} label="Aura" value={profile?.aura ?? 0} />
        <Stat icon={<Flame className="size-4 text-primary" />} label="Streak" value={`${profile?.streak_days ?? 0} d`} />
      </div>

      <LeagueCard tier={profile?.league_tier ?? 1} weeklyAura={profile?.weekly_aura ?? 0} />

      <section className="mt-8">
        <Link
          to="/badges"
          className="tap mb-3 flex items-center justify-between"
        >
          <h2 className="font-display text-lg font-semibold">Abzeichen-Regal</h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            Alle ansehen <ChevronRight className="size-3.5" />
          </span>
        </Link>
        {badges?.length ? (
          <Link to="/badges" className="grid grid-cols-4 gap-2">
            {badges.slice(0, 4).map((b: any) => (
              <div key={b.badge.slug} className="flex flex-col items-center rounded-2xl border border-border bg-surface p-2">
                <BadgeArt slug={b.badge.slug} size={56} />
                <div className="mt-1 line-clamp-1 text-[10px] leading-tight text-muted-foreground">{b.badge.name}</div>
              </div>
            ))}
          </Link>
        ) : (
          <Link to="/badges" className="block rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-sm text-muted-foreground">
            Noch keine Abzeichen – tippe hier, um alle zu sehen, die du freischalten kannst.
          </Link>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">Deine Challenges</h2>
        {myChallenges?.length ? (
          <ul className="space-y-2">
            {myChallenges.map((c: any) => {
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              return (
                <li key={c.id}>
                  <Link
                    to="/challenge/$id"
                    params={{ id: c.id }}
                    className={`tap block rounded-2xl border border-border px-4 py-3 ${expired ? "bg-muted/40 opacity-60" : "bg-surface"}`}
                  >
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.participant_count} dabei {expired && "· abgelaufen"}</div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Du hast noch keine Challenge gestartet.</p>
        )}
      </section>

      <section className="mt-10">
        <PillButton
          onClick={handleSignOut}
          tone="rose"
          icon={<LogOut className="size-4" />}
          label="Ausloggen"
        />
      </section>

      {user && (
        <AvatarEditor
          userId={user.id}
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={() => refreshProfile()}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}

function LeagueCard({ tier, weeklyAura }: { tier: number; weeklyAura: number }) {
  const league = getLeague(tier);
  const remaining = formatCountdown(msUntilWeekEnd());
  return (
    <Link
      to="/league"
      className="tap mt-3 flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4"
    >
      <div className="relative shrink-0">
        <div
          className="pointer-events-none absolute -inset-2 rounded-full opacity-40 blur-xl"
          style={{ background: `radial-gradient(circle, ${league.glow}, transparent 70%)` }}
        />
        <LeagueBadge tier={tier} size={56} className="relative" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aktuelle Liga</div>
        <div className={`font-display text-lg font-bold ${league.color}`}>{league.name}</div>
        <div className="text-xs text-muted-foreground">
          {weeklyAura} Aura diese Woche · endet in {remaining}
        </div>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
