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
      { title: "Anmelden – JoinUs" },
      { name: "description", content: "Melde dich an oder erstelle dein JoinUs Profil." },
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
          Join<span className="text-primary">Us</span>
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

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signup" ? "Schon dabei? Einloggen" : "Neu hier? Profil erstellen"}
        </button>
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
