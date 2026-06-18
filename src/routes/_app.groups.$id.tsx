import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAvatarUrl } from "@/lib/avatar-url";
import { toast } from "sonner";
import {
  ChevronLeft, UserPlus, Share2, Link as LinkIcon, BookUser, Crown, Loader2, X, Check,
  LogOut, MessageCircle, Plus, Sparkles, Flame, Trophy, Activity, ArrowUp,
} from "lucide-react";

export const Route = createFileRoute("/_app/groups/$id")({
  head: () => ({ meta: [{ title: `Gruppe – JoinUs` }] }),
  component: GroupDetail,
  errorComponent: ({ error }) => (
    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
      Konnte Gruppe nicht laden.<br />{error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="px-5 py-10 text-center text-sm text-muted-foreground">
      Diese Gruppe existiert nicht (mehr).
      <div className="mt-4"><Link to="/groups" className="text-primary">Zurück zu Gruppen</Link></div>
    </div>
  ),
});

function GroupDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: group } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("groups").select("*").eq("id", id).maybeSingle();
      if (error) throw error; return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("group_members")
        .select("role, joined_at, profile:profiles(id, username, display_name, avatar_url, aura, weekly_aura, streak_days, league_tier)")
        .eq("group_id", id).order("joined_at");
      if (error) throw error; return (data ?? []) as any[];
    },
  });

  const memberIds = (members ?? []).map((m: any) => m.profile?.id).filter(Boolean) as string[];

  const { data: activity } = useQuery({
    queryKey: ["group-activity", id, memberIds.join(",")],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("submissions")
        .select("id, created_at, caption, user_id, challenge:challenges(id, title, category)")
        .in("user_id", memberIds)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const isOwner = members?.some((m: any) => m.profile?.id === user?.id && m.role === "owner");
  const canInvite = isOwner || (group?.members_can_invite && members?.some((m: any) => m.profile?.id === user?.id));

  const totalAura = (members ?? []).reduce((s: number, m: any) => s + (m.profile?.aura ?? 0), 0);
  const topStreak = (members ?? []).reduce((max: number, m: any) => Math.max(max, m.profile?.streak_days ?? 0), 0);

  // Weekly leaderboard (top 5 by weekly_aura, fallback aura)
  const leaderboard = [...(members ?? [])]
    .filter((m: any) => m.profile)
    .sort((a: any, b: any) =>
      (b.profile.weekly_aura ?? 0) - (a.profile.weekly_aura ?? 0) ||
      (b.profile.aura ?? 0) - (a.profile.aura ?? 0)
    );

  const leave = async () => {
    if (!user) return;
    if (!confirm("Gruppe wirklich verlassen?")) return;
    const { error } = await (supabase as any).from("group_members").delete().eq("group_id", id).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Gruppe verlassen");
    qc.invalidateQueries({ queryKey: ["groups"] });
    nav({ to: "/groups" });
  };

  if (!group) {
    return <div className="px-5 py-10 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto size-5 animate-spin" /></div>;
  }

  return (
    <div className="px-5 pb-10 pt-4">
      <div className="flex items-center justify-between">
        <Link to="/groups" className="tap -ml-2 flex items-center gap-1 rounded-full p-2 text-muted-foreground">
          <ChevronLeft className="size-5" />
        </Link>
        <button onClick={leave} className="tap rounded-full p-2 text-muted-foreground" title="Verlassen">
          <LogOut className="size-4" />
        </button>
      </div>

      {/* Hero */}
      <div className="mt-2 flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-3xl bg-primary/15 text-3xl">{group.emoji ?? "👥"}</div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">{group.name}</h1>
          <div className="text-sm text-muted-foreground">{members?.length ?? 0} Mitglieder{isOwner ? " · du bist Owner" : ""}</div>
        </div>
      </div>
      {group.description && <p className="mt-3 text-sm text-foreground/80">{group.description}</p>}

      {/* Stats trio */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <StatTile icon={<Sparkles className="size-4 text-accent" />} value={totalAura} label="Gesamt-Aura" />
        <StatTile icon={<Flame className="size-4 text-primary" />} value={`${topStreak}d`} label="Top-Streak" />
        <StatTile icon={<Trophy className="size-4 text-yellow-400" />} value={members?.length ?? 0} label="Mitglieder" />
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionTile to="/chats" tone="sky" icon={<MessageCircle className="size-5" />} label="Chat" />
        <ActionTile to="/create" tone="primary" icon={<Plus className="size-5" />} label="Challenge" />
        <ActionTile
          onClick={() => canInvite && setInviteOpen(true)}
          tone="amber"
          icon={<UserPlus className="size-5" />}
          label="Einladen"
          disabled={!canInvite}
        />
      </div>

      {/* Weekly Leaderboard */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Wochen-Ranking</h2>
          <span className="text-[10px] text-muted-foreground">nach Aura diese Woche</span>
        </div>
        {leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-center text-sm text-muted-foreground">
            Noch keine Aura diese Woche. Startet eine Challenge!
          </div>
        ) : (
          <ol className="space-y-1.5">
            {leaderboard.slice(0, 5).map((m: any, i: number) => (
              <LeaderRow key={m.profile.id} rank={i + 1} profile={m.profile} isMe={m.profile.id === user?.id} />
            ))}
          </ol>
        )}
      </section>

      {/* Activity feed */}
      <section className="mt-7">
        <h2 className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Activity className="size-3.5" /> Aktivität
        </h2>
        {!activity?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-center text-sm text-muted-foreground">
            Noch keine Einreichungen. Wer macht den Anfang?
          </div>
        ) : (
          <ul className="space-y-1.5">
            {activity.map((a: any) => {
              const author = (members ?? []).find((m: any) => m.profile?.id === a.user_id)?.profile;
              return (
                <li key={a.id}>
                  <Link
                    to="/challenge/$id"
                    params={{ id: a.challenge?.id }}
                    className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
                  >
                    <div className="grid size-9 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
                      {(author?.username ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        <span className="font-semibold">{author?.display_name ?? author?.username ?? "Jemand"}</span>{" "}
                        <span className="text-muted-foreground">hat eine Challenge gemacht</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        „{a.challenge?.title ?? "Challenge"}" · {timeAgo(a.created_at)}
                      </div>
                    </div>
                    <ArrowUp className="size-4 -rotate-45 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Members */}
      <section className="mt-7">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Mitglieder ({members?.length ?? 0})
        </h2>
        <ul className="space-y-1.5">
          {members?.map((m: any) => (
            <MemberRow key={m.profile?.id} m={m} />
          ))}
        </ul>
      </section>

      {inviteOpen && (
        <InviteSheet groupId={id} groupName={group.name} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}

/* ============================ Small UI ============================ */

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function ActionTile({ to, icon, label, highlight }: { to: "/chats" | "/create"; icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <Link
      to={to}
      className={`tap flex flex-col items-center justify-center gap-1 rounded-2xl p-3 text-xs font-display font-semibold ${
        highlight ? "bg-primary text-primary-foreground glow-primary" : "border border-border bg-surface"
      }`}
    >
      <span className={highlight ? "" : "text-primary"}>{icon}</span>
      {label}
    </Link>
  );
}

function MemberRow({ m }: { m: any }) {
  const avatar = useAvatarUrl(m.profile?.avatar_url);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
      <div className="size-9 shrink-0 overflow-hidden rounded-xl bg-primary text-sm font-bold text-primary-foreground">
        {avatar ? (
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center">
            {(m.profile?.username ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{m.profile?.display_name ?? m.profile?.username}</div>
        <div className="truncate text-xs text-muted-foreground">@{m.profile?.username} · {m.profile?.aura ?? 0} Aura</div>
      </div>
      {m.role === "owner" && <Crown className="size-4 text-accent" />}
    </li>
  );
}

function LeaderRow({ rank, profile, isMe }: { rank: number; profile: any; isMe: boolean }) {
  const avatar = useAvatarUrl(profile.avatar_url);
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <li className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${isMe ? "border-primary bg-primary/10" : "border-border bg-surface"}`}>
      <div className="flex w-7 items-center justify-center text-sm font-semibold tabular-nums">
        {medal ?? rank}
      </div>
      <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
        {avatar ? (
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-xs font-semibold">
            {(profile.username ?? "??").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 truncate text-sm font-medium">
        {profile.display_name ?? profile.username} {isMe && <span className="text-xs text-primary">(du)</span>}
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold tabular-nums">
        <Sparkles className="size-3.5 text-accent" /> {profile.weekly_aura ?? 0}
      </div>
    </li>
  );
}

function timeAgo(ts: string) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return "gerade eben";
  if (d < 3600) return `${Math.floor(d / 60)} min`;
  if (d < 86400) return `${Math.floor(d / 3600)} h`;
  return `${Math.floor(d / 86400)} d`;
}

/* ============================ Invite Sheet ============================ */

function InviteSheet({ groupId, groupName, onClose }: { groupId: string; groupName: string; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"friends" | "link">("friends");
  const [link, setLink] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  const ensureLink = async () => {
    if (link || !user) return link;
    setGenBusy(true);
    try {
      const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "").slice(0, 24);
      const { error } = await (supabase as any).from("group_invites").insert({
        group_id: groupId, token, created_by: user.id,
      });
      if (error) throw error;
      const url = `${window.location.origin}/join/${token}`;
      setLink(url);
      return url;
    } catch (e: any) {
      toast.error(e.message ?? "Konnte Link nicht erstellen"); return null;
    } finally { setGenBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-background p-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Einladen zu „{groupName}"</h3>
          <button onClick={onClose} className="tap rounded-full bg-surface p-1.5"><X className="size-4" /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1 text-sm font-display">
          <button onClick={() => setTab("friends")} className={`tap rounded-xl py-2 ${tab === "friends" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Freunde</button>
          <button onClick={() => setTab("link")} className={`tap rounded-xl py-2 ${tab === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Link & Kontakte</button>
        </div>

        {tab === "friends"
          ? <FriendInviteList groupId={groupId} onChanged={() => qc.invalidateQueries({ queryKey: ["group-members", groupId] })} />
          : <LinkAndContacts ensureLink={ensureLink} link={link} groupName={groupName} genBusy={genBusy} />
        }
      </div>
    </div>
  );
}

function FriendInviteList({ groupId, onChanged }: { groupId: string; onChanged: () => void }) {
  const { user } = useAuth();
  const [adding, setAdding] = useState<string | null>(null);

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends-for-invite", user?.id, groupId],
    enabled: !!user,
    queryFn: async () => {
      const { data: f } = await (supabase as any)
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);
      const friendIds = (f ?? []).map((x: any) => x.requester_id === user!.id ? x.addressee_id : x.requester_id);
      if (!friendIds.length) return [];

      const { data: existing } = await (supabase as any)
        .from("group_members").select("user_id").eq("group_id", groupId);
      const inGroup = new Set((existing ?? []).map((x: any) => x.user_id));

      const { data: profs } = await (supabase as any)
        .from("profiles").select("id, username, display_name, avatar_url").in("id", friendIds);
      return (profs ?? []).filter((p: any) => !inGroup.has(p.id));
    },
  });

  const add = async (fid: string) => {
    setAdding(fid);
    const { error } = await (supabase as any).rpc("add_friend_to_group", { _group: groupId, _friend: fid });
    setAdding(null);
    if (error) return toast.error(error.message);
    toast.success("Hinzugefügt");
    onChanged();
  };

  if (isLoading) return <div className="mt-6 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (!friends?.length) return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      Keine Freunde verfügbar. Nutze stattdessen den Link-Tab, um neue Leute einzuladen.
    </p>
  );

  return (
    <ul className="mt-4 max-h-[50vh] space-y-1.5 overflow-y-auto">
      {friends.map((p: any) => (
        <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            {(p.username ?? "?").slice(0,2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{p.display_name ?? p.username}</div>
            <div className="truncate text-xs text-muted-foreground">@{p.username}</div>
          </div>
          <button
            onClick={() => add(p.id)} disabled={adding === p.id}
            className="tap flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {adding === p.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Add
          </button>
        </li>
      ))}
    </ul>
  );
}

function LinkAndContacts({ ensureLink, link, groupName, genBusy }: { ensureLink: () => Promise<string | null>; link: string | null; groupName: string; genBusy: boolean }) {
  const hasContactPicker = typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in (window as any);

  const copyLink = async () => {
    const url = await ensureLink(); if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  };

  const shareLink = async () => {
    const url = await ensureLink(); if (!url) return;
    const text = `Komm in unsere JoinUs-Gruppe „${groupName}":`;
    if (navigator.share) {
      try { await navigator.share({ title: `JoinUs – ${groupName}`, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Einladung kopiert");
    }
  };

  const pickFromPhonebook = async () => {
    const url = await ensureLink(); if (!url) return;
    try {
      const props = ["name", "tel"];
      // @ts-expect-error – Contact Picker API is non-standard
      const contacts: Array<{ name?: string[]; tel?: string[] }> = await navigator.contacts.select(props, { multiple: true });
      if (!contacts?.length) return;
      for (const c of contacts) {
        const phone = c.tel?.[0]?.replace(/\s+/g, "");
        const firstName = (c.name?.[0] ?? "").split(" ")[0] || "";
        const body = `Hey${firstName ? " " + firstName : ""}! Komm in unsere JoinUs-Gruppe „${groupName}": ${url}`;
        if (phone) {
          const sms = `sms:${phone}${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "&" : "?"}body=${encodeURIComponent(body)}`;
          window.location.href = sms;
          break;
        }
      }
    } catch {
      toast.error("Kontakte-Zugriff fehlgeschlagen");
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="rounded-2xl border border-border bg-surface p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Einladungslink (14 Tage gültig)</div>
        <div className="mt-1 break-all font-mono text-xs text-foreground/80">
          {genBusy ? "…erzeuge Link" : link ?? "Wird beim ersten Teilen erzeugt"}
        </div>
      </div>

      <ActionRow onClick={shareLink} icon={<Share2 className="size-5" />} label="Über App teilen" sub="WhatsApp, iMessage, Mail …" />
      <ActionRow onClick={copyLink} icon={<LinkIcon className="size-5" />} label="Link kopieren" />
      <ActionRow
        onClick={pickFromPhonebook}
        icon={<BookUser className="size-5" />}
        label="Aus Telefonbuch wählen"
        sub={hasContactPicker ? "Öffnet deine Kontakte (Android)" : "Nicht auf diesem Gerät – nutze Teilen"}
        disabled={!hasContactPicker}
      />
    </div>
  );
}

function ActionRow({ icon, label, sub, onClick, disabled }: { icon: React.ReactNode; label: string; sub?: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="tap flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left disabled:opacity-50">
      <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-sm font-semibold">{label}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </div>
    </button>
  );
}
