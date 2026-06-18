export type League = {
  tier: number;
  name: string;
  color: string; // tailwind text color
  ring: string;  // tailwind ring color
  glow: string;  // hex for radial gradient
};

export const LEAGUES: League[] = [
  { tier: 1, name: "Ember",   color: "text-orange-400",  ring: "ring-orange-500/50",  glow: "#fb923c" },
  { tier: 2, name: "Spark",   color: "text-amber-300",   ring: "ring-amber-400/50",   glow: "#fbbf24" },
  { tier: 3, name: "Flare",   color: "text-yellow-300",  ring: "ring-yellow-400/50",  glow: "#facc15" },
  { tier: 4, name: "Blaze",   color: "text-rose-400",    ring: "ring-rose-500/50",    glow: "#fb7185" },
  { tier: 5, name: "Storm",   color: "text-sky-400",     ring: "ring-sky-500/50",     glow: "#38bdf8" },
  { tier: 6, name: "Nova",    color: "text-violet-400",  ring: "ring-violet-500/50",  glow: "#a78bfa" },
  { tier: 7, name: "Eclipse", color: "text-indigo-300",  ring: "ring-indigo-400/50",  glow: "#818cf8" },
  { tier: 8, name: "Apex",    color: "text-fuchsia-300", ring: "ring-fuchsia-400/60", glow: "#e879f9" },
];

export const PROMOTION_COUNT = 7;
export const DEMOTION_COUNT = 5;

export function getLeague(tier?: number | null): League {
  return LEAGUES[Math.min(Math.max((tier ?? 1) - 1, 0), LEAGUES.length - 1)];
}

/** Returns ms until next Monday 00:00 (local) */
export function msUntilWeekEnd(now = new Date()): number {
  const d = new Date(now);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const daysUntilMon = (8 - day) % 7 || 7; // next Monday (never 0)
  const next = new Date(d);
  next.setDate(d.getDate() + daysUntilMon);
  next.setHours(0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
