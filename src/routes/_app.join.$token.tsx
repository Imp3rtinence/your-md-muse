import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/join/$token")({
  head: () => ({ meta: [{ title: "Crew beitreten – Komma" }] }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invite-preview", token],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("preview_group_invite", { _token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const join = async () => {
    setBusy(true);
    const { data: gid, error } = await (supabase as any).rpc("join_group_with_token", { _token: token });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Willkommen in der Crew!");
    nav({ to: "/groups/$id", params: { id: gid } });
  };

  if (isLoading) return <div className="px-5 pt-20 text-center"><Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" /></div>;

  if (!data) return (
    <div className="px-5 pt-16 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="mt-3 font-display text-xl font-bold">Einladung nicht gefunden</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vielleicht abgelaufen oder schon gelöscht.</p>
      <Link to="/groups" className="tap mt-5 inline-block rounded-full bg-primary px-5 py-3 font-display text-sm font-bold text-primary-foreground">zu meinen Crews</Link>
    </div>
  );

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="grid size-24 place-items-center rounded-[2rem] bg-primary/15 text-5xl">{data.emoji}</div>
      <h1 className="mt-5 font-display text-2xl font-bold">{data.group_name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{data.member_count} Mitglieder</p>
      {data.expired ? (
        <p className="mt-6 text-sm text-destructive">Diese Einladung ist abgelaufen.</p>
      ) : (
        <button onClick={join} disabled={busy}
          className="tap mt-8 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 font-display font-bold text-primary-foreground glow-primary disabled:opacity-60">
          {busy ? <Loader2 className="size-5 animate-spin" /> : <><Users className="size-4" /> Beitreten</>}
        </button>
      )}
    </div>
  );
}
