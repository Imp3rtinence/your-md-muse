import { Link } from "@tanstack/react-router";
import type { ReactNode, MouseEvent } from "react";

type Tone = "primary" | "sky" | "amber" | "violet" | "emerald" | "rose";

const TONES: Record<Tone, { from: string; to: string; ring: string; text: string; glow: string }> = {
  primary: { from: "#f0abfc", to: "#c026d3", ring: "rgba(217,70,239,0.45)", text: "text-fuchsia-200", glow: "#e879f9" },
  sky:     { from: "#7dd3fc", to: "#0284c7", ring: "rgba(14,165,233,0.45)", text: "text-sky-200",    glow: "#38bdf8" },
  amber:   { from: "#fcd34d", to: "#d97706", ring: "rgba(217,119,6,0.45)", text: "text-amber-200",  glow: "#fbbf24" },
  violet:  { from: "#c4b5fd", to: "#6d28d9", ring: "rgba(109,40,217,0.45)", text: "text-violet-200", glow: "#a78bfa" },
  emerald: { from: "#6ee7b7", to: "#047857", ring: "rgba(4,120,87,0.45)",   text: "text-emerald-200",glow: "#34d399" },
  rose:    { from: "#fda4af", to: "#be123c", ring: "rgba(190,18,60,0.45)", text: "text-rose-200",   glow: "#fb7185" },
};

type BaseProps = {
  icon: ReactNode;
  label: string;
  sub?: string;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
};

type ButtonProps = BaseProps & { onClick?: (e: MouseEvent<HTMLButtonElement>) => void; to?: undefined };
type LinkProps = BaseProps & { to: string; params?: Record<string, string>; onClick?: undefined };

export function ActionTile(props: ButtonProps | LinkProps) {
  const { icon, label, sub, tone = "primary", size = "md", disabled, fullWidth, className = "" } = props;
  const t = TONES[tone];

  const sizing =
    size === "lg" ? "p-4 gap-3" :
    size === "sm" ? "p-2.5 gap-1.5" :
    "p-3 gap-2";
  const iconBox =
    size === "lg" ? "size-11 rounded-2xl" :
    size === "sm" ? "size-8 rounded-lg" :
    "size-9 rounded-xl";
  const labelSize =
    size === "lg" ? "text-sm" :
    size === "sm" ? "text-[11px]" :
    "text-xs";

  const inner = (
    <span className={`relative flex flex-col items-center justify-center text-center ${sizing}`}>
      {/* radial glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"
        style={{ background: `radial-gradient(120% 80% at 50% 0%, ${t.ring}, transparent 70%)` }}
      />
      {/* icon pill with gradient */}
      <span
        className={`relative grid ${iconBox} place-items-center text-white shadow-lg`}
        style={{
          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
          boxShadow: `0 6px 18px -6px ${t.ring}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        {icon}
      </span>
      <span className={`relative font-display font-semibold ${labelSize} ${t.text}`}>{label}</span>
      {sub && <span className="relative text-[10px] text-muted-foreground">{sub}</span>}
    </span>
  );

  const shellClass =
    `group tap relative isolate overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur-sm ` +
    `transition-all duration-200 hover:-translate-y-0.5 hover:border-transparent active:translate-y-0 ` +
    `disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ` +
    (fullWidth ? "w-full " : "") + className;

  // gradient ring on hover via mask trick: outline ring using ::before
  const ring = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        padding: "1px",
        background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );

  if ("to" in props && props.to) {
    return (
      <Link to={props.to as any} params={props.params as any} className={shellClass}>
        {ring}{inner}
      </Link>
    );
  }
  return (
    <button onClick={(props as ButtonProps).onClick} disabled={disabled} className={shellClass}>
      {ring}{inner}
    </button>
  );
}

/** A horizontal row variant (used in sheets/lists) */
export function ActionRow({
  icon, label, sub, onClick, disabled, tone = "primary",
}: {
  icon: ReactNode; label: string; sub?: string; onClick: () => void; disabled?: boolean; tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="tap group relative isolate flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-3 text-left transition-all hover:-translate-y-0.5 hover:border-transparent active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          padding: "1px",
          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <span
        className="relative grid size-10 place-items-center rounded-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
          boxShadow: `0 6px 18px -6px ${t.ring}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        {icon}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold">{label}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    </button>
  );
}

/** Large pill button — for primary destructive/positive actions (logout etc) */
export function PillButton({
  icon, label, onClick, tone = "rose",
}: {
  icon?: ReactNode; label: string; onClick: () => void; tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <button
      onClick={onClick}
      className="tap group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-border bg-surface/80 px-5 py-3.5 font-display font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-transparent active:translate-y-0"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(120% 100% at 50% 100%, ${t.ring}, transparent 70%)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          padding: "1px",
          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
          opacity: 0.6,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {icon && (
        <span
          className="relative grid size-7 place-items-center rounded-lg text-white"
          style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
        >
          {icon}
        </span>
      )}
      <span className={`relative ${t.text}`}>{label}</span>
    </button>
  );
}
