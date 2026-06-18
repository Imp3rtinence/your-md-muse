import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ChevronLeft, UserPlus, Share2, Link as LinkIcon, BookUser, Crown, Loader2, X, Check, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app/groups/$id")({
  head: ({ params }) => ({ meta: [{ title: `Gruppe – JoinUs` }] }),
  component: GroupDetail,
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
        .select("role, joined_at, profile:profiles(id, username, display_name, avatar_url)")
        .eq("group_id", id).order("joined_at");
      if (error) throw error; return data ?? [];
    },
  });

  const isOwner = members?.some((m: any) => m.profile?.id === user?.id && m.role === "owner");
  const canInvite = isOwner || (group?.members_can_invite && members?.some((m: any) => m.profile?.id === user?.id));

  const leave = async () => {
    if (!user) return;
    if (!confirm("Gruppe wirklich verlassen?")) return;
    const { error } = await (supabase as any).from("group_members").delete().eq("group_id", id).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Gruppe verlassen");
    qc.invalidateQueries({ queryKey: ["groups"] });
    nav({ to: "/groups" });
  };

  return (
    <div className="px-5 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link to="/groups" className="tap -ml-2 flex items-center gap-1 rounded-full p-2 text-muted-foreground">
          <ChevronLeft className="size-5" />
        </Link>
        <button onClick={leave} className="tap rounded-full p-2 text-muted-foreground" title="Verlassen">
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-3xl bg-primary/15 text-3xl">{group?.emoji ?? "👥"}</div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">{group?.name ?? "…"}</h1>
          <div className="text-sm text-muted-foreground">{members?.length ?? 0} Mitglieder</div>
        </div>
      </div>
      {group?.description && <p className="mt-3 text-sm text-foreground/80">{group.description}</p>}

      {canInvite && (
        <button
          onClick={() => setInviteOpen(true)}
          className="tap mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-semibold text-primary-foreground glow-primary"
        >
          <UserPlus className="size-4" /> Leute einladen
        </button>
      )}

      <h2 className="mb-2 mt-7 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mitglieder</h2>
      <ul className="space-y-1.5">
        {members?.map((m: any) => (
          <li key={m.profile?.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              {(m.profile?.username ?? "?").slice(0,2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{m.profile?.display_name ?? m.profile?.username}</div>
              <div className="truncate text-xs text-muted-foreground">@{m.profile?.username}</div>
            </div>
            {m.role === "owner" && <Crown className="size-4 text-accent" />}
          </li>
        ))}
      </ul>

      {inviteOpen && group && (
        <InviteSheet groupId={id} groupName={group.name} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}

/* ============================ Invite Sheet ============================ */

function InviteSheet({ groupId, groupName, onClose }: { groupId: string; groupName: string; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"friends" | "link">("friends");
  const [link, setLink] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  // ensure an invite link exists (lazily)
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
          // only first contact – browser won't queue multiple sms intents
          break;
        }
      }
    } catch (e: any) {
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
