import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  token_hash: z.string().optional(),
  type: z.string().optional(),
  next: z.string().optional(),
});

export const Route = createFileRoute("/confirm")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Registrierung bestätigen – Komma" },
      { name: "description", content: "Bestätige deine Komma-Registrierung und öffne die App." },
    ],
    links: [{ rel: "canonical", href: "https://komma.fun/confirm" }],
  }),
  component: ConfirmRegistration,
});

function ConfirmRegistration() {
  const nav = useNavigate();
  const search = useSearch({ from: "/confirm" });
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Dein Link wird geprüft …");

  const targetPath = useMemo(() => {
    if (typeof window === "undefined") return "/home";
    if (!search.next) return "/home";
    try {
      const parsed = new URL(search.next, window.location.origin);
      const allowedHosts = [window.location.host, "komma.fun", "www.komma.fun"];
      return allowedHosts.includes(parsed.host) ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/home";
    } catch {
      return "/home";
    }
  }, [search.next]);

  useEffect(() => {
    let cancelled = false;

    const confirm = async () => {
      if (!search.token_hash) {
        setStatus("error");
        setMessage("Der Registrierungslink ist unvollständig. Bitte fordere einen neuen Link an.");
        return;
      }

      const type = search.type || "signup";
      const { error } = await supabase.auth.verifyOtp({
        token_hash: search.token_hash,
        type: type as "signup" | "magiclink" | "email",
      });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setMessage(error.message || "Der Link ist abgelaufen oder wurde bereits verwendet.");
        return;
      }

      setStatus("success");
      setMessage("Alles bestätigt. Du wirst weitergeleitet …");
      window.setTimeout(() => nav({ to: targetPath as "/home" }), 650);
    };

    confirm();
    return () => { cancelled = true; };
  }, [nav, search.token_hash, search.type, targetPath]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--primary)" }} />
      <main className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-7 flex size-16 items-center justify-center rounded-2xl bg-surface-2 text-primary">
          {status === "loading" && <Loader2 className="size-8 animate-spin" />}
          {status === "success" && <CheckCircle2 className="size-8" />}
          {status === "error" && <XCircle className="size-8" />}
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight">
          {status === "error" ? "Link klappt nicht." : "Komma öffnet …"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>

        {status === "error" && (
          <Link
            to="/auth"
            className="tap mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 font-display font-semibold text-primary-foreground glow-primary"
          >
            Neuen Link holen
          </Link>
        )}
      </main>
    </div>
  );
}