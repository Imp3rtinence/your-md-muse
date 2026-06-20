import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Anmelden – Komma" },
      { name: "description", content: "Melde dich an oder erstelle dein Komma Profil." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) nav({ to: "/home" });
  }, [session, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (cleaned.length < 3) { toast.error("Username: min. 3 Zeichen, nur a–z, 0–9, _"); setBusy(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { username: cleaned, display_name: cleaned },
          },
        });
        if (error) throw error;
        toast.success("Profil erstellt. Los geht's!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Etwas ist schiefgelaufen");
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-6 pb-10 pt-10">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full blur-3xl opacity-50" style={{ background: "var(--primary)" }} />
      <div className="relative mx-auto max-w-md">
        <Link to="/" className="font-display text-xl font-bold">
          Komma<span className="text-primary">,</span>
        </Link>

        <h1 className="mt-10 font-display text-3xl font-bold tracking-tight">
          {mode === "signup" ? "Mach mit." : "Willkommen zurück."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup" ? "Dein Profil ist privat – nur Freunde können dich finden." : "Logg dich ein und schau, was deine Crew gerade macht."}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          {mode === "signup" && (
            <Field label="Username">
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="z.B. levi_07"
                autoComplete="username"
                className="input"
              />
            </Field>
          )}
          <Field label="E-Mail">
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" className="input"
            />
          </Field>
          <Field label="Passwort">
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8} className="input"
            />
          </Field>

          <button
            type="submit" disabled={busy}
            className="tap mt-2 flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 font-display font-semibold text-primary-foreground glow-primary disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : (mode === "signup" ? "Profil erstellen" : "Einloggen")}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>oder</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <OAuthButton
            label="Mit Google fortfahren"
            onClick={async () => {
              const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/home` });
              if (r.error) toast.error(r.error.message ?? "Google-Login fehlgeschlagen");
            }}
            icon={<GoogleIcon />}
          />
          <OAuthButton
            label="Mit Apple fortfahren"
            onClick={async () => {
              const r = await lovable.auth.signInWithOAuth("apple", { redirect_uri: `${window.location.origin}/home` });
              if (r.error) toast.error(r.error.message ?? "Apple-Login fehlgeschlagen");
            }}
            icon={<AppleIcon />}
          />
        </div>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Schon dabei? Einloggen" : "Neu hier? Profil erstellen"}
        </button>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
          Mit dem Fortfahren akzeptierst du unsere{" "}
          <a href="/legal/agb" className="text-primary underline-offset-2 hover:underline">AGB</a>
          {" "}und kennst unser{" "}
          <a href="/legal/impressum" className="text-primary underline-offset-2 hover:underline">Impressum</a>.
        </p>
      </div>


      <style>{`
        .input { width:100%; padding:14px 16px; border-radius:14px; background:var(--surface); color:var(--foreground); border:1px solid var(--border); font-size:16px; outline:none; }
        .input:focus { border-color:var(--primary); box-shadow:0 0 0 3px oklch(0.7 0.27 320 / 0.25); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function OAuthButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3.5 font-display font-semibold text-foreground transition hover:bg-foreground/5"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M16.37 12.6c-.03-3.07 2.5-4.55 2.62-4.62-1.43-2.09-3.66-2.38-4.45-2.41-1.89-.19-3.69 1.11-4.65 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.98 1.2-5.05 3.06-2.15 3.73-.55 9.25 1.54 12.28 1.02 1.48 2.24 3.15 3.83 3.09 1.54-.06 2.12-1 3.98-1 1.85 0 2.38 1 4.01.97 1.65-.03 2.7-1.51 3.71-3 1.17-1.72 1.65-3.39 1.68-3.48-.04-.02-3.22-1.24-3.19-4.95zM13.3 3.55c.85-1.03 1.42-2.46 1.26-3.88-1.22.05-2.7.81-3.58 1.84-.79.91-1.48 2.37-1.3 3.76 1.36.11 2.76-.69 3.62-1.72z"/>
    </svg>
  );
}
