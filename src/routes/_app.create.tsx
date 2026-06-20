import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, type CategoryValue } from "@/lib/categories";
import { toast } from "sonner";
import { ShieldAlert, Loader2, Sparkles, Wand2 } from "lucide-react";
import { suggestChallenge } from "@/lib/ai/smart-create.functions";
import { generateHeroImage } from "@/lib/ai/hero-image.functions";
import { embedChallenge } from "@/lib/ai/embeddings.functions";

const searchSchema = z.object({ parent: z.string().optional() });

export const Route = createFileRoute("/_app/create")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Challenge erstellen – Komma" }] }),
  component: Create,
});

function Create() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { parent } = useSearch({ from: "/_app/create" });
  const askAi = useServerFn(suggestChallenge);
  const askHero = useServerFn(generateHeroImage);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryValue>("creative");
  const [visibility, setVisibility] = useState<"friends" | "public">("friends");
  const [durationH, setDurationH] = useState<number>(24);
  const [tags, setTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"leicht" | "mittel" | "mutig" | null>(null);
  const [withHero, setWithHero] = useState(true);
  const [busy, setBusy] = useState(false);

  // AI assist
  const [aiKeyword, setAiKeyword] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const DURATIONS = [
    { h: 12, label: "12 Std" },
    { h: 24, label: "24 Std" },
    { h: 72, label: "3 Tage" },
    { h: 168, label: "7 Tage" },
  ];

  const runAi = async (mode: "from-keyword" | "improve") => {
    setAiBusy(true);
    try {
      const res = await askAi({
        data: mode === "from-keyword"
          ? { keyword: aiKeyword }
          : { keyword: title || aiKeyword || "verbessere meinen Entwurf", current_title: title, current_description: description },
      });
      setTitle(res.title);
      setDescription(res.description);
      setCategory(res.category);
      setDurationH(res.duration_hours);
      setTags(res.tags);
      setDifficulty(res.difficulty);
      toast.success("Vorschlag eingefügt — passe ihn an, wie du magst.");
    } catch (e: any) {
      toast.error(e?.message ?? "KI hat nicht reagiert.");
    } finally {
      setAiBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (title.trim().length < 3) { toast.error("Gib einen Titel ein."); return; }
    setBusy(true);
    const expiresAt = new Date(Date.now() + durationH * 3600 * 1000).toISOString();
    const { data, error } = await (supabase as any).from("challenges").insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category, visibility,
      expires_at: expiresAt,
      parent_challenge_id: parent ?? null,
      tags,
      difficulty,
    }).select("id").single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    // Hero-Bild im Hintergrund (blockt navigation nicht lang)
    if (withHero) {
      askHero({ data: { challenge_id: data.id, title: title.trim(), description: description.trim() || null } })
        .catch((e) => console.warn("Hero image failed", e));
    }
    setBusy(false);
    toast.success("Challenge ist live ⚡");
    nav({ to: "/challenge/$id", params: { id: data.id } });
  };

  return (
    <div className="px-5 pb-6 pt-6">
      <h1 className="font-display text-2xl font-bold">
        {parent ? "Du bist dran – starte die nächste" : "Neue Challenge"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mach mit, mach es echt. Lieber klein und konkret als groß und schwammig.
      </p>

      {/* KI-Assistent */}
      <section className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-accent" /> Mit KI ausarbeiten
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Tipp ein Stichwort ein — Komma macht einen Vorschlag, den du frei anpassen kannst.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={aiKeyword}
            onChange={(e) => setAiKeyword(e.target.value)}
            placeholder="z.B. Skateboard, Frühstück malen, Nachbar fragen"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={() => runAi("from-keyword")}
            disabled={aiBusy || !aiKeyword.trim()}
            className="tap inline-flex items-center gap-1 rounded-2xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Vorschlag
          </button>
        </div>
        {title && (
          <button
            type="button"
            onClick={() => runAi("improve")}
            disabled={aiBusy}
            className="tap mt-2 text-xs font-medium text-accent underline-offset-2 hover:underline disabled:opacity-50"
          >
            ✨ Aktuellen Entwurf verbessern
          </button>
        )}
      </section>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div>
          <label className="lbl">Titel</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            maxLength={80} required placeholder="z.B. Zeichne dein Frühstück"
            className="input"
          />
        </div>
        <div>
          <label className="lbl">Beschreibung (optional)</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} maxLength={500} placeholder="Was genau ist die Aufgabe?"
            className="input"
          />
        </div>

        {tags.length > 0 && (
          <div>
            <label className="lbl">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="tap rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Entfernen"
                >
                  #{t} ×
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="lbl">Kategorie</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <button
                  key={c.value} type="button"
                  onClick={() => setCategory(c.value)}
                  className={"tap rounded-2xl border p-3 text-left transition " +
                    (active ? "border-primary bg-primary/15" : "border-border bg-surface")}
                >
                  <div className="text-xl">{c.icon}</div>
                  <div className="mt-1 text-xs font-medium">{c.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="lbl">Sichtbarkeit</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "friends", t: "Nur Freunde", s: "Sicher & klein" },
              { v: "public",  t: "Öffentlich",  s: "Alle können mitmachen" },
            ].map((o) => {
              const active = visibility === o.v;
              return (
                <button
                  key={o.v} type="button"
                  onClick={() => setVisibility(o.v as "friends" | "public")}
                  className={"tap rounded-2xl border p-3 text-left " +
                    (active ? "border-primary bg-primary/15" : "border-border bg-surface")}
                >
                  <div className="text-sm font-semibold">{o.t}</div>
                  <div className="text-xs text-muted-foreground">{o.s}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="lbl">Läuft ab in</label>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => {
              const active = durationH === d.h;
              return (
                <button
                  key={d.h} type="button"
                  onClick={() => setDurationH(d.h)}
                  className={"tap rounded-2xl border p-3 text-center transition " +
                    (active ? "border-primary bg-primary/15" : "border-border bg-surface")}
                >
                  <div className="text-sm font-semibold">{d.label}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Endet am {new Date(Date.now() + durationH * 3600 * 1000).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-sm">
          <input
            type="checkbox"
            checked={withHero}
            onChange={(e) => setWithHero(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="flex-1">
            <span className="font-medium">KI-Coverbild erstellen</span>
            <span className="ml-2 text-xs text-muted-foreground">Wird im Hintergrund generiert.</span>
          </span>
          <Sparkles className="size-4 text-accent" />
        </label>

        <div className="flex gap-2 rounded-2xl border border-border bg-surface p-3 text-xs text-muted-foreground">
          <ShieldAlert className="size-4 shrink-0 text-accent" />
          <span>Keine gefährlichen Challenges – sei kein NPC, pass auf dich und andere auf.</span>
        </div>

        <button
          type="submit" disabled={busy}
          className="tap flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 font-display font-semibold text-primary-foreground glow-primary disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : "Challenge starten"}
        </button>
      </form>

      <style>{`
        .lbl { display:block; margin-bottom:8px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted-foreground); font-weight:500; }
        .input { width:100%; padding:14px 16px; border-radius:14px; background:var(--surface); color:var(--foreground); border:1px solid var(--border); font-size:16px; outline:none; }
        .input:focus { border-color:var(--primary); box-shadow:0 0 0 3px oklch(0.7 0.27 320 / 0.25); }
      `}</style>
    </div>
  );
}
