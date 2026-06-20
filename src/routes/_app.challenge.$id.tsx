import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categoryMeta, STICKERS } from "@/lib/categories";
import { ArrowLeft, Camera, Flag, Loader2, Link2, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAvatarUrl } from "@/lib/avatar-url";
import { useProofUrl } from "@/lib/proof-url";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BotBadge } from "@/components/BotBadge";
import { useServerFn } from "@tanstack/react-start";
import { botCheerSubmission } from "@/lib/ai/bot-cheer.functions";
import { explainChallenge } from "@/lib/ai/explain.functions";
import { Sparkles } from "lucide-react";

function ProofMedia({ path, type, username }: { path: string; type: string; username?: string }) {
  const url = useProofUrl(path);
  if (!url) return <div className="aspect-square w-full animate-pulse bg-surface-2" />;
  return type === "video"
    ? <video src={url} controls className="aspect-square w-full object-cover" />
    : <img src={url} alt={`Beweis von @${username ?? ""}`} className="aspect-square w-full object-cover" />;
}

function AvatarBubble({ path, username, ring }: { path?: string | null; username?: string | null; ring: string }) {
  const url = useAvatarUrl(path);
  if (url) return <img src={url} alt={username ?? ""} className={`size-12 rounded-full object-cover ring-2 ${ring}`} />;
  return (
    <div className={`flex size-12 items-center justify-center rounded-full bg-surface-2 font-semibold text-muted-foreground ring-2 ${ring}`}>
      {(username ?? "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

export const Route = createFileRoute("/_app/challenge/$id")({
  head: () => ({ meta: [{ title: "Challenge – Komma" }] }),
  component: ChallengeDetail,
});

function ChallengeDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cheer = useServerFn(botCheerSubmission);
  const askExplain = useServerFn(explainChallenge);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);

  const { data: c } = useQuery({
    queryKey: ["challenge", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("challenges")
        .select("*, creator:profiles!challenges_creator_id_fkey(username,display_name,avatar_url,is_ai_bot,bot_persona,bio)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("submissions")
        .select("*, user:profiles!submissions_user_id_fkey(username,display_name,avatar_url)")
        .eq("challenge_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("comments")
        .select("*, user:profiles!comments_user_id_fkey(username,display_name,avatar_url,is_ai_bot)")
        .eq("challenge_id", id)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: chain } = useQuery({
    queryKey: ["chain", id, c?.parent_challenge_id],
    enabled: !!c,
    queryFn: async () => {
      // walk backwards
      const back: any[] = [];
      let cur: any = c;
      while (cur?.parent_challenge_id) {
        const { data } = await (supabase as any).from("challenges")
          .select("id,title,creator:profiles!challenges_creator_id_fkey(username,avatar_url)")
          .eq("id", cur.parent_challenge_id).single();
        if (!data) break;
        back.unshift(data); cur = data;
      }
      const { data: forward } = await (supabase as any).from("challenges")
        .select("id,title,creator:profiles!challenges_creator_id_fkey(username,avatar_url)")
        .eq("parent_challenge_id", id).limit(5);
      return { back, forward: forward ?? [] };
    },
  });

  const mySubmission = submissions?.find((s: any) => s.user_id === user?.id);

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("proofs").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await (supabase as any).from("submissions").insert({
        challenge_id: id, user_id: user.id,
        media_url: path,
        media_type: file.type.startsWith("video") ? "video" : "image",
      });
      if (insErr) throw insErr;
      setJustFinished(true);
      toast.success("Beweis hochgeladen – du bist dran! +20 Aura");
      qc.invalidateQueries({ queryKey: ["submissions", id] });
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      // Im Hintergrund: ein Bot feuert kurz an
      cheer({ data: { challenge_id: id } })
        .then(() => qc.invalidateQueries({ queryKey: ["comments", id] }))
        .catch(() => {});
    } catch (e: any) { toast.error(e.message ?? "Upload fehlgeschlagen"); }
    finally { setUploading(false); }
  };

  const react = async (sticker: string) => {
    if (!user) return;
    await (supabase as any).from("reactions").insert({
      user_id: user.id, challenge_id: id, sticker,
    });
    toast(sticker);
  };

  const report = async () => {
    if (!user) return;
    const reason = prompt("Warum meldest du diese Challenge?");
    if (!reason) return;
    await (supabase as any).from("reports").insert({
      reporter_id: user.id, target_type: "challenge", target_id: id, reason,
    });
    toast.success("Danke – wir schauen es uns an.");
  };

  const openEdit = () => {
    setEditTitle(c.title ?? "");
    setEditDesc(c.description ?? "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) { toast.error("Titel darf nicht leer sein"); return; }
    setSavingEdit(true);
    const { error } = await (supabase as any).from("challenges")
      .update({ title: editTitle.trim(), description: editDesc.trim() || null })
      .eq("id", id);
    setSavingEdit(false);
    if (error) { toast.error(error.message); return; }
    setEditOpen(false);
    toast.success("Challenge aktualisiert");
    qc.invalidateQueries({ queryKey: ["challenge", id] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  };

  const removeChallenge = async () => {
    if (!confirm("Challenge wirklich löschen? Alle Beweise und Kommentare gehen verloren.")) return;
    setDeleting(true);
    const { error } = await (supabase as any).from("challenges").delete().eq("id", id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Challenge gelöscht");
    qc.invalidateQueries({ queryKey: ["feed"] });
    nav({ to: "/home" });
  };

  if (!c) return <div className="p-6 text-muted-foreground">…</div>;
  const cat = categoryMeta(c.category);
  const isOwner = user?.id === c.creator_id;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur">
        <button onClick={() => nav({ to: "/home" })} className="tap -ml-2 flex items-center text-muted-foreground">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex items-center gap-3">
          {isOwner && (
            <>
              <button onClick={openEdit} className="tap text-muted-foreground hover:text-foreground" aria-label="Bearbeiten">
                <Pencil className="size-4" />
              </button>
              <button onClick={removeChallenge} disabled={deleting} className="tap text-muted-foreground hover:text-destructive disabled:opacity-50" aria-label="Löschen">
                <Trash2 className="size-4" />
              </button>
            </>
          )}
          <button onClick={report} className="tap text-xs text-muted-foreground hover:text-destructive">
            <Flag className="size-4" />
          </button>
        </div>
      </header>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Challenge bearbeiten</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Titel" />
            <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Beschreibung" rows={4} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Abbrechen</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? <Loader2 className="size-4 animate-spin" /> : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium">{cat.icon} {cat.label}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            @{c.creator?.username}
            {c.creator?.is_ai_bot && <BotBadge size="xs" />}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight">{c.title}</h1>
        {c.difficulty && (
          <span className="mt-2 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {c.difficulty}
          </span>
        )}
        {c.description && <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>}
        {Array.isArray(c.tags) && c.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.tags.map((t: string) => (
              <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
        <HeroImage path={c.hero_image_url} />

        {/* Erklär's mir */}
        <div className="mt-3">
          {explanation ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-foreground">
              <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent"><Sparkles className="size-3" /> Erklärung</div>
              {explanation}
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                setExplainBusy(true);
                try {
                  const r = await askExplain({ data: { title: c.title, description: c.description } });
                  setExplanation(r.explanation);
                } catch { toast.error("Geht gerade nicht."); }
                finally { setExplainBusy(false); }
              }}
              disabled={explainBusy}
              className="tap inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {explainBusy ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3 text-accent" />}
              Erklär's mir
            </button>
          )}
        </div>

        {c.creator?.is_ai_bot && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
            <BotBadge size="sm" />
            <span>
              Diese Challenge stammt von <span className="font-medium text-foreground">@{c.creator?.username}</span> – einem Community-Bot von Komma, der Ideen streut.
            </span>
          </div>
        )}

        {/* Chain */}
        {(chain && (chain.back.length || chain.forward.length)) ? (
          <div className="mt-5 rounded-2xl border border-border bg-surface p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Link2 className="size-3.5" /> Die Kette
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {chain.back.map((p: any) => (
                <ChainDot key={p.id} username={p.creator?.username} to={p.id} />
              ))}
              <span className="mx-1 h-px w-4 bg-border" />
              <ChainDot username={c.creator?.username} current />
              {chain.forward.map((f: any) => (
                <span key={f.id} className="flex items-center"><span className="mx-1 h-px w-4 bg-border" /><ChainDot username={f.creator?.username} to={f.id} /></span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Stickers */}
        <div className="mt-5 flex gap-2">
          {STICKERS.map((s) => (
            <button key={s} onClick={() => react(s)} className="tap rounded-full border border-border bg-surface px-3 py-2 text-lg active:scale-95 transition">
              {s}
            </button>
          ))}
        </div>

        {/* Teilnehmer */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Users className="size-5 text-muted-foreground" />
            Teilnehmer · {(submissions?.length ? new Set(submissions.map((s: any) => s.user_id)).size : 0) + (c.creator_id && !submissions?.some((s: any) => s.user_id === c.creator_id) ? 1 : 0)}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Creator */}
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="relative">
                <AvatarBubble path={c.creator?.avatar_url} username={c.creator?.username} ring="ring-primary" />
                <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">Host</span>
              </div>
              <span className="max-w-[72px] truncate text-[11px] font-medium">@{c.creator?.username}</span>
            </div>
            {/* Submissions */}
            {(() => {
              const seen = new Set<string>();
              const list: any[] = [];
              for (const s of submissions ?? []) {
                if (!seen.has(s.user_id) && s.user_id !== c.creator_id) {
                  seen.add(s.user_id);
                  list.push(s);
                }
              }
              return list.map((s: any) => (
                <div key={s.user_id} className="flex shrink-0 flex-col items-center gap-1.5">
                  <AvatarBubble path={s.user?.avatar_url} username={s.user?.username} ring="ring-border" />
                  <span className="max-w-[72px] truncate text-[11px] font-medium">@{s.user?.username}</span>
                </div>
              ));
            })()}
          </div>
        </section>

        {/* CTA */}
        {!mySubmission ? (
          <>
            <input ref={fileRef} type="file" accept="image/*,video/*" capture="environment" className="hidden"
                   onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button
              onClick={() => fileRef.current?.click()} disabled={uploading}
              className="tap mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 font-display font-semibold text-accent-foreground glow-accent disabled:opacity-60"
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <><Camera className="size-5" /> Mitmachen</>}
            </button>
          </>
        ) : (
          <div className={"mt-5 rounded-2xl border border-accent/40 bg-accent/10 p-4 " + (justFinished ? "animate-pop" : "")}>
            <div className="font-display text-lg font-bold text-accent">Du hast abgeschlossen! 🎉</div>
            <p className="mt-1 text-sm text-muted-foreground">Reich die Kette weiter – starte die nächste Challenge.</p>
            <Link
              to="/create" search={{ parent: id }}
              className="tap mt-3 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 font-display text-sm font-semibold text-primary-foreground"
            >
              Du bist dran – nächste Challenge starten
            </Link>
          </div>
        )}

        {/* Proofs */}
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Beweise · {submissions?.length ?? 0}</h2>
          {submissions?.length ? (
            <div className="grid grid-cols-2 gap-2">
              {submissions.map((s: any) => (
                <figure key={s.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                  <ProofMedia path={s.media_url} type={s.media_type} username={s.user?.username} />
                  <figcaption className="px-2 py-1.5 text-[11px] text-muted-foreground">@{s.user?.username}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Noch niemand dabei. Sei der/die Erste.</p>
          )}
        </section>

        {/* Comments */}
        <Comments id={id} comments={comments ?? []} />
      </div>
    </div>
  );
}

function HeroImage({ path }: { path?: string | null }) {
  const url = useProofUrl(path);
  if (!url) return null;
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-2">
      <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
    </div>
  );
}

function ChainDot({ username, current, to }: { username?: string; current?: boolean; to?: string }) {
  const dot = (
    <div className={"flex size-9 items-center justify-center rounded-full text-[10px] font-semibold " +
      (current ? "bg-primary text-primary-foreground glow-primary" : "bg-surface-2 text-muted-foreground")}>
      {(username ?? "?").slice(0,2).toUpperCase()}
    </div>
  );
  if (to) return <Link to="/challenge/$id" params={{ id: to }}>{dot}</Link>;
  return dot;
}

function Comments({ id, comments }: { id: string; comments: any[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setBusy(true);
    await (supabase as any).from("comments").insert({
      challenge_id: id, user_id: user.id, body: text.trim(),
    });
    setText(""); setBusy(false);
    qc.invalidateQueries({ queryKey: ["comments", id] });
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-lg font-semibold">Kommentare · {comments.length}</h2>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              @{c.user?.username}
              {c.user?.is_ai_bot && <BotBadge size="xs" />}
            </div>
            <div className="mt-0.5 text-sm">{c.body}</div>
          </div>
        ))}
        {!comments.length && <p className="text-sm text-muted-foreground">Sag was Nettes oder feuer an.</p>}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Kommentar…"
               className="flex-1 rounded-full border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary" />
        <button disabled={busy || !text.trim()} className="tap rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          Senden
        </button>
      </form>
    </section>
  );
}
