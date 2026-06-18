import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Sparkles, Flame, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profil – JoinUs" }] }),
  component: Profile,
});

function Profile() {
  const { profile, user, signOut } = useAuth();

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
        .from("challenges").select("id,title,category,participant_count,created_at")
        .eq("creator_id", user!.id).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex size-20 items-center justify-center rounded-3xl bg-primary text-2xl font-display font-bold text-primary-foreground glow-primary">
            {(profile?.username ?? "??").slice(0,2).toUpperCase()}
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">{profile?.display_name ?? profile?.username}</h1>
          <div className="text-sm text-muted-foreground">@{profile?.username} · privat</div>
        </div>
        <button onClick={signOut} className="tap rounded-full border border-border p-2 text-muted-foreground">
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat icon={<Sparkles className="size-4 text-accent" />} label="Aura" value={profile?.aura ?? 0} />
        <Stat icon={<Flame className="size-4 text-primary" />} label="Streak" value={`${profile?.streak_days ?? 0} d`} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">Abzeichen-Regal</h2>
        {badges?.length ? (
          <div className="grid grid-cols-4 gap-2">
            {badges.map((b: any) => (
              <div key={b.badge.slug} className="rounded-2xl border border-border bg-surface p-3 text-center">
                <div className="text-2xl">{b.badge.icon}</div>
                <div className="mt-1 text-[10px] leading-tight text-muted-foreground">{b.badge.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Noch keine Abzeichen – starte deine erste Challenge.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">Deine Challenges</h2>
        {myChallenges?.length ? (
          <ul className="space-y-2">
            {myChallenges.map((c: any) => (
              <li key={c.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.participant_count} dabei</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Du hast noch keine Challenge gestartet.</p>
        )}
      </section>
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
