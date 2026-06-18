import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Home, Users, Plus, MessageCircle, User } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !session) nav({ to: "/auth" }); }, [loading, session, nav]);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">…</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items: Array<{ to: "/home" | "/groups" | "/create" | "/chats" | "/profile"; icon: typeof Home; label: string; primary?: boolean }> = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/groups", icon: Users, label: "Gruppen" },
    { to: "/create", icon: Plus, label: "Neu", primary: true },
    { to: "/chats", icon: MessageCircle, label: "Chats" },
    { to: "/profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4 pt-2"
         style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <div className="flex items-stretch justify-between rounded-3xl border border-border bg-surface/90 px-2 py-2 backdrop-blur-xl shadow-2xl">
        {items.map(({ to, icon: Icon, label, primary }) => {
          const active = path === to || (to !== "/home" && path.startsWith(to));
          if (primary) {
            return (
              <Link key={to} to={to} className="tap relative -mt-6 flex flex-1 items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow-primary">
                  <Icon className="size-7" />
                </span>
              </Link>
            );
          }
          return (
            <Link key={to} to={to} className="tap flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5">
              <Icon className={"size-5 " + (active ? "text-primary" : "text-muted-foreground")} />
              <span className={"text-[10px] font-medium " + (active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
