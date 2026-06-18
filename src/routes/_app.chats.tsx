import { createFileRoute, Link } from "@tanstack/react-router";
import { ActionTile } from "@/components/ActionTile";
import { Users, UserPlus, Sparkles, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_app/chats")({
  head: () => ({ meta: [{ title: "Chats – JoinUs" }] }),
  component: Chats,
});

function Chats() {
  return (
    <div className="px-5 pb-10 pt-6">
      <h1 className="font-display text-2xl font-bold">Chats</h1>

      {/* Empty state hero */}
      <div className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-10 opacity-40"
          style={{
            background:
              "radial-gradient(40% 50% at 50% 0%, rgba(217,70,239,0.35), transparent 70%), radial-gradient(50% 40% at 80% 100%, rgba(56,189,248,0.25), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-fuchsia-700 text-white shadow-lg">
            <MessageCircle className="size-7" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">Chats kommen bald</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Direktnachrichten zwischen bestätigten Freunden. Sicher by default.
          </p>
        </div>
      </div>

      {/* In der Zwischenzeit */}
      <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        In der Zwischenzeit
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionTile to="/groups" tone="sky" icon={<Users className="size-5" />} label="Gruppen" />
        <ActionTile to="/profile" tone="amber" icon={<UserPlus className="size-5" />} label="Freunde" />
        <ActionTile to="/league" tone="primary" icon={<Sparkles className="size-5" />} label="Liga" />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Tipp: <Link to="/groups" className="text-primary underline-offset-2 hover:underline">Gruppen-Chats</Link> sind schon nutzbar.
      </p>
    </div>
  );
}
