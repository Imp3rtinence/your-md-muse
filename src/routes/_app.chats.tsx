import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAvatarUrl } from "@/lib/avatar-url";
import { toast } from "sonner";
import { MessageCircle, Search, UserPlus, Check, X, Loader2 } from "lucide-react";
import { AdSlot, AD_SLOTS } from "@/components/AdSlot";

export const Route = createFileRoute("/_app/chats")({
  head: () => ({ meta: [{ title: "Chats – Komma" }] }),
  component: Chats,
});

type Thread = {
  other_id: string;
  other_username: string;
  other_display_name: string | null;
  other_avatar_url: string | null;
  last_body: string;
  last_at: string;
  last_sender_id: string;
  unread_count: number;
};

type FriendRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  requester: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  addressee: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

function Chats() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"chats" | "freunde">("chats");

  const threadsQ = useQuery({
    queryKey: ["dm-threads"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_dm_threads");
      if (error) throw error;
      return (data ?? []) as Thread[];
    },
  });

  const friendsQ = useQuery({
    queryKey: ["friendships", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("friendships")
        .select(`
          id, requester_id, addressee_id, status,
          requester:profiles!friendships_requester_id_fkey(id,username,display_name,avatar_url),
          addressee:profiles!friendships_addressee_id_fkey(id,username,display_name,avatar_url)
        `)
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);
      if (error) throw error;
      return (data ?? []) as FriendRow[];
    },
  });

  // Pending requests via SECURITY DEFINER RPC so private requester profiles stay visible
  const pendingQ = useQuery({
    queryKey: ["friend-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_friend_requests");
      if (error) throw error;
      return (data ?? []) as Array<{
        friendship_id: string;
        direction: "incoming" | "outgoing";
        other_id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        created_at: string;
      }>;
    },
  });

  // Poll DM threads (realtime publication disabled for privacy)
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      qc.invalidateQueries({ queryKey: ["dm-threads"] });
      qc.invalidateQueries({ queryKey: ["friend-requests", user?.id] });
    }, 10000);
    return () => clearInterval(t);
  }, [user, qc]);

  const pending = pendingQ.data ?? [];
  const incoming = pending
    .filter(p => p.direction === "incoming")
    .map(p => ({
      id: p.friendship_id,
      requester_id: p.other_id,
      addressee_id: user?.id ?? "",
      status: "pending" as const,
      requester: { id: p.other_id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url },
      addressee: null,
    })) as FriendRow[];
  const outgoing = pending
    .filter(p => p.direction === "outgoing")
    .map(p => ({
      id: p.friendship_id,
      requester_id: user?.id ?? "",
      addressee_id: p.other_id,
      status: "pending" as const,
      requester: null,
      addressee: { id: p.other_id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url },
    })) as FriendRow[];
  const accepted = (friendsQ.data ?? []).filter(f => f.status === "accepted");

  const totalUnread = (threadsQ.data ?? []).reduce((s, t) => s + t.unread_count, 0);

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Chats</h1>
        {totalUnread > 0 && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
            {totalUnread}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1">
        <TabBtn active={tab === "chats"} onClick={() => setTab("chats")} label="Unterhaltungen" />
        <TabBtn
          active={tab === "freunde"}
          onClick={() => setTab("freunde")}
          label={`Freunde${incoming.length ? ` · ${incoming.length}` : ""}`}
        />
      </div>

      {tab === "chats" ? (
        <ChatsTab threads={threadsQ.data ?? []} loading={threadsQ.isLoading} onPickFriend={() => setTab("freunde")} />
      ) : (
        <FriendsTab
          incoming={incoming}
          outgoing={outgoing}
          accepted={accepted}
          meId={user?.id}
          onChange={() => {
            qc.invalidateQueries({ queryKey: ["friendships", user?.id] });
            qc.invalidateQueries({ queryKey: ["friend-requests", user?.id] });
            qc.invalidateQueries({ queryKey: ["dm-threads"] });
          }}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`tap rounded-xl px-3 py-2 text-sm font-medium transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );
}

/* -------------------- Chats Tab -------------------- */

function ChatsTab({ threads, loading, onPickFriend }: { threads: Thread[]; loading: boolean; onPickFriend: () => void }) {
  if (loading) {
    return <div className="mt-8 flex justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  }
  if (!threads.length) {
    return (
      <div className="mt-6 rounded-3xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-fuchsia-700 text-white shadow-lg">
          <MessageCircle className="size-7" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold">Noch keine Chats</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Schreib einem Freund die erste Nachricht.
        </p>
        <button
          onClick={onPickFriend}
          className="tap mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <UserPlus className="size-4" /> Freund auswählen
        </button>
      </div>
    );
  }
  return (
    <ul className="mt-4 space-y-1.5">
      {threads.map((t, i) => (
        <Fragment key={t.other_id}>
          <ThreadRow t={t} />
          {(i + 1) % 10 === 0 && i < threads.length - 1 && (
            <li className="list-none">
              <AdSlot slot={AD_SLOTS.chats} variant="inline" />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );
}

function ThreadRow({ t }: { t: Thread }) {
  const avatar = useAvatarUrl(t.other_avatar_url);
  const isMine = false; // placeholder, derived below
  const name = t.other_display_name ?? t.other_username;
  const preview = (t.last_sender_id === t.other_id ? "" : "Du: ") + t.last_body;
  return (
    <li>
      <Link
        to="/chat/$userId"
        params={{ userId: t.other_id }}
        className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3"
      >
        <div className="size-12 shrink-0 overflow-hidden rounded-full bg-muted">
          {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : (
            <div className="flex size-full items-center justify-center text-sm font-bold">
              {(t.other_username ?? "??").slice(0,2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate font-semibold">{name}</div>
            <div className="shrink-0 text-[11px] text-muted-foreground">{formatTime(t.last_at)}</div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className={`truncate text-sm ${t.unread_count ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {preview}
            </div>
            {t.unread_count > 0 && (
              <span className="ml-2 grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {t.unread_count}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
  void isMine;
}

/* -------------------- Freunde Tab -------------------- */

function FriendsTab({
  incoming, outgoing, accepted, meId, onChange,
}: {
  incoming: FriendRow[]; outgoing: FriendRow[]; accepted: FriendRow[];
  meId?: string; onChange: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ id: string; username: string; display_name: string | null; avatar_url: string | null }>>([]);
  const [searching, setSearching] = useState(false);

  // Lookup map for already-existing relationships
  const relMap = useMemo(() => {
    const m = new Map<string, "accepted" | "incoming" | "outgoing">();
    accepted.forEach(f => {
      const other = f.requester_id === meId ? f.addressee_id : f.requester_id;
      m.set(other, "accepted");
    });
    incoming.forEach(f => m.set(f.requester_id, "incoming"));
    outgoing.forEach(f => m.set(f.addressee_id, "outgoing"));
    return m;
  }, [accepted, incoming, outgoing, meId]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await (supabase as any).rpc("search_users", { _q: term });
      setSearching(false);
      if (error) { toast.error("Suche fehlgeschlagen"); return; }
      setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const sendRequest = async (otherId: string) => {
    const { error } = await (supabase as any).rpc("send_friend_request", { _other: otherId });
    if (error) { toast.error(error.message); return; }
    toast.success("Anfrage gesendet");
    onChange();
  };

  const respond = async (otherId: string, accept: boolean) => {
    const { error } = await (supabase as any).rpc("respond_friend_request", { _other: otherId, _accept: accept });
    if (error) { toast.error(error.message); return; }
    toast.success(accept ? "Freund hinzugefügt" : "Abgelehnt");
    onChange();
  };

  return (
    <div className="mt-4 space-y-6">
      {/* Search */}
      <div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Freund per @username suchen…"
            className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        {q.trim().length >= 2 && (
          <ul className="mt-2 space-y-1.5">
            {searching && <li className="px-2 py-3 text-center text-xs text-muted-foreground"><Loader2 className="mx-auto size-4 animate-spin" /></li>}
            {!searching && results.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">Niemand gefunden</li>
            )}
            {results.map(r => {
              const rel = relMap.get(r.id);
              return (
                <UserRow key={r.id} u={r} rightSlot={
                  rel === "accepted" ? <Pill label="Befreundet" /> :
                  rel === "outgoing" ? <Pill label="Angefragt" /> :
                  rel === "incoming" ? (
                    <div className="flex gap-1">
                      <IconBtn onClick={() => respond(r.id, true)} icon={<Check className="size-4" />} tone="emerald" />
                      <IconBtn onClick={() => respond(r.id, false)} icon={<X className="size-4" />} tone="rose" />
                    </div>
                  ) : (
                    <button onClick={() => sendRequest(r.id)} className="tap rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                      Anfragen
                    </button>
                  )
                } />
              );
            })}
          </ul>
        )}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Anfragen ({incoming.length})</h3>
          <ul className="space-y-1.5">
            {incoming.map(f => f.requester && (
              <UserRow key={f.id} u={f.requester} rightSlot={
                <div className="flex gap-1">
                  <IconBtn onClick={() => respond(f.requester_id, true)} icon={<Check className="size-4" />} tone="emerald" />
                  <IconBtn onClick={() => respond(f.requester_id, false)} icon={<X className="size-4" />} tone="rose" />
                </div>
              } />
            ))}
          </ul>
        </section>
      )}

      {/* Outgoing */}
      {outgoing.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ausgehende</h3>
          <ul className="space-y-1.5">
            {outgoing.map(f => f.addressee && (
              <UserRow key={f.id} u={f.addressee} rightSlot={<Pill label="Wartet" />} />
            ))}
          </ul>
        </section>
      )}

      {/* Friends */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Freunde ({accepted.length})</h3>
        {accepted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Freunde – nutze die Suche oben.</p>
        ) : (
          <ul className="space-y-1.5">
            {accepted.map(f => {
              const other = f.requester_id === meId ? f.addressee : f.requester;
              if (!other) return null;
              return (
                <UserRow
                  key={f.id}
                  u={other}
                  rightSlot={<ChatLinkBtn userId={other.id} />}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ChatLinkBtn({ userId }: { userId: string }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav({ to: "/chat/$userId", params: { userId } })}
      className="tap inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
    >
      <MessageCircle className="size-3.5" /> Chat
    </button>
  );
}

function UserRow({
  u, rightSlot,
}: {
  u: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  rightSlot?: React.ReactNode;
}) {
  const avatar = useAvatarUrl(u.avatar_url);
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
      <div className="size-10 shrink-0 overflow-hidden rounded-full bg-muted">
        {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : (
          <div className="flex size-full items-center justify-center text-xs font-semibold">{u.username.slice(0,2).toUpperCase()}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{u.display_name ?? u.username}</div>
        <div className="truncate text-[11px] text-muted-foreground">@{u.username}</div>
      </div>
      {rightSlot}
    </li>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">{label}</span>;
}

function IconBtn({ onClick, icon, tone, label }: { onClick: () => void; icon: React.ReactNode; tone: "emerald" | "rose"; label?: string }) {
  const cls = tone === "emerald" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400";
  return (
    <button onClick={onClick} className={`tap grid size-8 place-items-center rounded-full ${cls}`}>
      {icon}
    </button>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diffDays = Math.floor((+now - +d) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}
