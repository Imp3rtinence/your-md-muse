import { useEffect, useRef, useState } from "react";

export const ADSENSE_CLIENT = "ca-pub-2713661045074217";

type AdSlotProps = {
  /** AdSense slot id (data-ad-slot). When missing, the component renders nothing. */
  slot?: string;
  /** Visual variant. */
  variant?: "feed" | "inline" | "banner";
  /** Optional override for ad format. */
  format?: string;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Smooth, non-intrusive AdSense slot.
 * - Renders nothing if no slot id is configured (auto-ads still work via the global script).
 * - Reserves min-height to avoid layout shift.
 * - Discreet "Anzeige" label so users know it's an ad.
 */
export function AdSlot({ slot, variant = "inline", format, className = "" }: AdSlotProps) {
  const ref = useRef<HTMLModElement | null>(null);
  const pushed = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!slot || !mounted) return;
    // Lazy-load adsbygoogle.js on the client only (avoids SSR hydration mismatch from auto-ads).
    const SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    if (!document.querySelector(`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`)) {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* swallow — adsense may be blocked */
    }
  }, [slot, mounted]);

  if (!slot || !mounted) return null;

  const minH =
    variant === "feed" ? 180 : variant === "banner" ? 100 : 140;

  return (
    <div
      className={`my-4 overflow-hidden rounded-2xl border border-border/60 bg-surface/40 ${className}`}
      style={{ minHeight: minH }}
      aria-label="Werbung"
    >
      <div className="px-3 pt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Anzeige
      </div>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight: minH - 20 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format ?? "fluid"}
        data-ad-layout-key={variant === "feed" ? "-6t+ed+2i-1n-4w" : undefined}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export const AD_SLOTS = {
  feed: import.meta.env.VITE_ADSENSE_SLOT_FEED as string | undefined,
  challenge: import.meta.env.VITE_ADSENSE_SLOT_CHALLENGE as string | undefined,
  chats: import.meta.env.VITE_ADSENSE_SLOT_CHATS as string | undefined,
};
