import { Bot } from "lucide-react";

/** Kleines Badge das auf KI-Community-Bots hinweist. */
export function BotBadge({ size = "sm", withLabel = false }: { size?: "xs" | "sm" | "md"; withLabel?: boolean }) {
  const px = size === "xs" ? "size-3.5" : size === "md" ? "size-5" : "size-4";
  return (
    <span
      title="Community-Bot von Komma"
      className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent"
    >
      <Bot className={px} />
      {withLabel && <span>Community-Bot</span>}
    </span>
  );
}
