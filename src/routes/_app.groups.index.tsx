import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Plus, Users, ChevronRight, X, Loader2, Sparkles } from "lucide-react";
import { recommendCrews, embedCrew } from "@/lib/ai/embeddings.functions";

export const Route = createFileRoute("/_app/groups/")({
  head: () => ({ meta: [{ title: "Crews – Komma" }] }),
  component: Groups,
});

const EMOJIS = ["👥","🔥","⚡","🎯","🏆","🎨","🎮","⚽","🏀","🎸","📚","🧗","🍕","✈️","🌊","🌈"];

const KINDS: Array<{ id: string; label: string; emoji: string }> = [
  { id: "friends", label: "Freunde", emoji: "👥" },
  { id: "school", label: "Schule", emoji: "🏫" },
  { id: "sport", label: "Sport", emoji: "⚽" },
  { id: "neighborhood", label: "Nachbarschaft", emoji: "🏘️" },
  { id: "other", label: "Sonstiges", emoji: "✨" },
];

const KIND_LABEL: Record<string, string> = Object.fromEntries(KINDS.map(k => [k.id, k.label]));
const KIND_EMOJI: Record<string, string> = Object.fromEntries(KINDS.map(k => [k.id, k.emoji]));

function Groups() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("group_members")
        .select("role, group:groups(id,name,emoji,description,kind,created_at)")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="px-5 pb-6 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Crews</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="tap flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 font-display text-sm font-bold text-primary-foreground glow-primary"
        >
          <Plus className="size-4" /> Neu
        </button>
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : !groups?.length ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-surface p-8 text-center">
          <div className="text-4xl">👥</div>
          <h2 className="mt-3 font-display text-lg font-semibold">Noch keine Crew</h2>
          <p className="mt-1 text-sm text-muted-foreground">Klasse, Team, Familie, Nachbarn – starte eine eigene und lade deine Leute ein.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="tap mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground glow-primary"
          >
            <Plus className="size-4" /> Erste Crew anlegen
          </button>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {groups.map((m: any) => (
            <li key={m.group.id}>
              <Link
                to="/groups/$id" params={{ id: m.group.id }}
                className="tap flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:bg-foreground/5"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-2xl">{m.group.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display font-semibold">{m.group.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium">
                      <span>{KIND_EMOJI[m.group.kind] ?? "👥"}</span>
                      <span>{KIND_LABEL[m.group.kind] ?? "Freunde"}</span>
                    </span>
                    <span className="truncate">{m.role === "owner" ? "Owner" : "Mitglied"}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {createOpen && (
        <CreateGroupModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); qc.invalidateQueries({ queryKey: ["groups"] }); }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [kind, setKind] = useState("friends");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    const n = name.trim();
    if (n.length < 2) return toast.error("Name min. 2 Zeichen");
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("groups").insert({
        name: n, description: desc.trim() || null, emoji, kind, creator_id: user.id,
      });
      if (error) throw error;
      toast.success("Crew erstellt");
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? "Fehlgeschlagen");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-background p-5 sm:rounded-3xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Neue Crew</h2>
          <button onClick={onClose} className="tap rounded-full bg-surface p-1.5"><X className="size-4" /></button>
        </div>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Art</label>
        <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {KINDS.map(k => (
            <button key={k.id} onClick={() => setKind(k.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${kind === k.id ? "bg-primary text-primary-foreground" : "bg-surface text-foreground/80"}`}>
              <span>{k.emoji}</span>{k.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Symbol</label>
        <div className="mt-1 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setEmoji(e)} className={`shrink-0 grid size-10 place-items-center rounded-xl text-xl ${emoji === e ? "bg-primary text-primary-foreground" : "bg-surface"}`}>{e}</button>
          ))}
        </div>

        <label className="mt-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="z. B. 10b Crew" maxLength={50}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary" />

        <label className="mt-3 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Beschreibung (optional)</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} maxLength={280} rows={2}
          className="mt-1 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary" />

        <button onClick={submit} disabled={busy}
          className="tap mt-5 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 font-display font-semibold text-primary-foreground glow-primary disabled:opacity-60">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <><Users className="mr-2 size-4" /> Erstellen</>}
        </button>
      </div>
    </div>
  );
}
