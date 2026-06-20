import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useAvatarUrl } from "@/lib/avatar-url";
import { toast } from "sonner";
import { ChevronLeft, Send, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/chat/$userId")({
  head: () => ({ meta: [{ title: "Chat – Komma" }] }),
  component: ChatThread,
});

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type OtherProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

function ChatThread() {
  const { userId: otherId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();

  const me = user?.id;

  // Friendship guard
  const friendQ = useQuery({
    queryKey: ["friend-check", me, otherId],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("friendships")
        .select("status,requester_id,addressee_id")
        .or(`and(requester_id.eq.${me},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${me})`)
        .maybeSingle();
      if (error) throw error;
      return data as { status: "pending" | "accepted" | "blocked"; requester_id: string; addressee_id: string } | null;
    },
  });

  const otherQ = useQuery({
    queryKey: ["profile-min", otherId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles").select("id,username,display_name,avatar_url").eq("id", otherId).maybeSingle();
      return data as OtherProfile | null;
    },
  });

  const messagesQ = useQuery({
    queryKey: ["dm", me, otherId],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_dm_thread", { _other: otherId, _limit: 500 });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });


  // Realtime
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`dm-${me}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        (payload: any) => {
          const row = (payload.new ?? payload.old) as Message | undefined;
          if (!row) return;
          const involvesPair =
            (row.sender_id === me && row.recipient_id === otherId) ||
            (row.sender_id === otherId && row.recipient_id === me);
          if (!involvesPair) return;
          qc.invalidateQueries({ queryKey: ["dm", me, otherId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, otherId, qc]);

  // Mark thread read on view + when new messages arrive
  useEffect(() => {
    if (!me || !messagesQ.data) return;
    const hasUnread = messagesQ.data.some(m => m.recipient_id === me && !m.read_at);
    if (!hasUnread) return;
    (async () => {
      await (supabase as any).rpc("mark_dm_thread_read", { _other: otherId });
      qc.invalidateQueries({ queryKey: ["dm-threads"] });
    })();
  }, [me, otherId, messagesQ.data, qc]);

  // Scroll to bottom on new messages
  const listRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messagesQ.data?.length]);

  const otherAvatar = useAvatarUrl(otherQ.data?.avatar_url);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = friendQ.data?.status === "accepted";

  const send = async () => {
    const text = body.trim();
    if (!text || !me || sending) return;
    setSending(true);
    const { error } = await (supabase as any).rpc("send_dm", { _recipient: otherId, _body: text });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
    qc.invalidateQueries({ queryKey: ["dm", me, otherId] });
    qc.invalidateQueries({ queryKey: ["dm-threads"] });
  };


  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const name = otherQ.data?.display_name ?? otherQ.data?.username ?? "…";

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <button onClick={() => nav({ to: "/chats" })} className="tap -ml-1 p-1 text-muted-foreground">
          <ChevronLeft className="size-5" />
        </button>
        <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
          {otherAvatar ? <img src={otherAvatar} alt="" className="size-full object-cover" /> :
            <div className="flex size-full items-center justify-center text-xs font-semibold">
              {(otherQ.data?.username ?? "??").slice(0,2).toUpperCase()}
            </div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{name}</div>
          {otherQ.data?.username && (
            <div className="truncate text-[11px] text-muted-foreground">@{otherQ.data.username}</div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messagesQ.isLoading ? (
          <div className="flex justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
        ) : !canSend ? (
          <FriendGate status={friendQ.data?.status} />
        ) : (messagesQ.data?.length ?? 0) === 0 ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">
            Sag Hi 👋
          </div>
        ) : (
          <MessageList messages={messagesQ.data!} meId={me!} />
        )}
      </div>

      {/* Composer */}
      {canSend && (
        <div className="border-t border-border bg-background px-3 py-2"
             style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={onKey}
              placeholder="Nachricht…"
              rows={1}
              maxLength={2000}
              className="max-h-32 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="tap grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageList({ messages, meId }: { messages: Message[]; meId: string }) {
  // group by day
  const groups: Array<{ day: string; items: Message[] }> = [];
  for (const m of messages) {
    const day = new Date(m.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.day} className="space-y-1.5">
          <div className="my-2 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
            {formatDayLabel(g.day)}
          </div>
          {g.items.map((m, i) => {
            const mine = m.sender_id === meId;
            const prev = g.items[i - 1];
            const grouped = prev && prev.sender_id === m.sender_id && (+new Date(m.created_at) - +new Date(prev.created_at) < 5 * 60 * 1000);
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md border border-border bg-surface text-foreground"
                  } ${grouped ? "mt-0.5" : ""}`}
                >
                  {m.body}
                  <div className={`mt-0.5 text-right text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FriendGate({ status }: { status?: "pending" | "accepted" | "blocked" }) {
  return (
    <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-dashed border-border bg-surface/60 p-5 text-center text-sm">
      {status === "pending" ? (
        <>
          <div className="font-semibold">Anfrage offen</div>
          <p className="mt-1 text-muted-foreground">Sobald die Freundschaft bestätigt ist, könnt ihr chatten.</p>
        </>
      ) : (
        <>
          <div className="font-semibold">Nur Freunde können chatten</div>
          <p className="mt-1 text-muted-foreground">Schick zuerst eine Freundschaftsanfrage.</p>
          <Link to="/chats" className="tap mt-3 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            Zu den Freunden
          </Link>
        </>
      )}
    </div>
  );
}

function formatDayLabel(dayStr: string) {
  const d = new Date(dayStr);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Heute";
  if (d.toDateString() === yest.toDateString()) return "Gestern";
  return d.toLocaleDateString([], { day: "2-digit", month: "long", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}
