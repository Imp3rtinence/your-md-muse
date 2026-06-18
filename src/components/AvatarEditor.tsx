import { useEffect, useRef, useState } from "react";
import { X, RotateCw, Type, Smile, Trash2, Check, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Filter = "none" | "bw" | "warm" | "cool" | "vivid" | "fade";
type Sticker = {
  id: string;
  kind: "text" | "emoji";
  value: string;
  x: number; // 0..1
  y: number;
  scale: number;
  color: string;
};

const FILTERS: { id: Filter; label: string; css: string }[] = [
  { id: "none", label: "Original", css: "none" },
  { id: "vivid", label: "Vivid", css: "saturate(1.6) contrast(1.1)" },
  { id: "warm", label: "Warm", css: "sepia(0.25) saturate(1.2) hue-rotate(-10deg)" },
  { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(15deg) brightness(1.02)" },
  { id: "fade", label: "Fade", css: "contrast(0.9) brightness(1.05) saturate(0.85)" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.05)" },
];

const EMOJIS = ["🔥","✨","💀","😎","🥲","💯","🫶","👀","⚡","🌈","🍀","🎯","🦄","🤘","🫧","🤍"];
const STICKER_COLORS = ["#FFFFFF","#FF2D87","#A6FF00","#FFD400","#00D2FF","#000000"];

export function AvatarEditor({
  userId,
  open,
  onClose,
  onSaved,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (path: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("none");
  const [brightness, setBrightness] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setSrc(null); setFilter("none"); setBrightness(1); setRotate(0); setScale(1);
      setOffset({ x: 0, y: 0 }); setStickers([]); setActiveId(null);
    }
  }, [open]);

  const onFile = (f: File) => {
    if (!f.type.startsWith("image/")) return toast.error("Bitte ein Bild auswählen");
    if (f.size > 12 * 1024 * 1024) return toast.error("Bild ist zu groß (max 12 MB)");
    const url = URL.createObjectURL(f);
    setSrc(url);
  };

  // ---------- gesture handling ----------
  const dragRef = useRef<{ kind: "image" | "sticker"; id?: string; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const pinchRef = useRef<{ baseDist: number; baseScale: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    const stickerEl = t.closest<HTMLElement>("[data-sticker-id]");
    if (stickerEl) {
      const id = stickerEl.dataset.stickerId!;
      const s = stickers.find(x => x.id === id);
      if (!s) return;
      setActiveId(id);
      dragRef.current = { kind: "sticker", id, startX: e.clientX, startY: e.clientY, baseX: s.x, baseY: s.y };
    } else {
      setActiveId(null);
      dragRef.current = { kind: "image", startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    if (d.kind === "image") {
      setOffset({ x: d.baseX + dx, y: d.baseY + dy });
    } else if (d.id) {
      setStickers(prev => prev.map(s => s.id === d.id ? { ...s, x: Math.max(0, Math.min(1, d.baseX + dx)), y: Math.max(0, Math.min(1, d.baseY + dy)) } : s));
    }
  };
  const onPointerUp = () => { dragRef.current = null; };

  // wheel = zoom image; if a sticker is active, scale that sticker instead
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (activeId) {
      setStickers(prev => prev.map(s => s.id === activeId ? { ...s, scale: Math.max(0.3, Math.min(3, s.scale - e.deltaY * 0.002)) } : s));
    } else {
      setScale(s => Math.max(0.5, Math.min(4, s - e.deltaY * 0.002)));
    }
  };

  const addText = () => {
    const value = window.prompt("Text:", "");
    if (!value?.trim()) return;
    setStickers(s => [...s, { id: crypto.randomUUID(), kind: "text", value: value.trim(), x: 0.5, y: 0.5, scale: 1, color: textColor }]);
  };
  const addEmoji = (em: string) => {
    setStickers(s => [...s, { id: crypto.randomUUID(), kind: "emoji", value: em, x: 0.5, y: 0.5, scale: 1, color: "#fff" }]);
    setShowEmoji(false);
  };
  const removeActive = () => {
    if (!activeId) return;
    setStickers(s => s.filter(x => x.id !== activeId));
    setActiveId(null);
  };

  // ---------- export ----------
  const save = async () => {
    if (!src || busy) return;
    setBusy(true);
    try {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // circular clip for that "snap" feel
      ctx.fillStyle = "#0b0b10";
      ctx.fillRect(0, 0, size, size);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      ctx.save();
      // cover-fit base
      const baseScale = Math.max(size / img.width, size / img.height);
      const w = img.width * baseScale * scale;
      const h = img.height * baseScale * scale;
      ctx.translate(size / 2 + offset.x * size, size / 2 + offset.y * size);
      ctx.rotate((rotate * Math.PI) / 180);
      const f = FILTERS.find(x => x.id === filter)!.css;
      ctx.filter = `${f === "none" ? "" : f + " "}brightness(${brightness})`;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      // stickers
      ctx.filter = "none";
      for (const s of stickers) {
        const px = s.x * size, py = s.y * size;
        ctx.save();
        ctx.translate(px, py);
        const fontSize = (s.kind === "emoji" ? 64 : 44) * s.scale;
        ctx.font = `${s.kind === "emoji" ? "" : "800 "}${fontSize}px ${s.kind === "emoji" ? "system-ui" : '"Space Grotesk", system-ui, sans-serif'}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (s.kind === "text") {
          ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
          ctx.fillStyle = s.color;
        } else {
          ctx.fillStyle = "#fff";
        }
        ctx.fillText(s.value, 0, 0);
        ctx.restore();
      }

      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.92));
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { error: pErr } = await (supabase as any).from("profiles").update({ avatar_url: path }).eq("id", userId);
      if (pErr) throw pErr;
      toast.success("Profilbild aktualisiert");
      onSaved(path);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const filterCss = `${FILTERS.find(x => x.id === filter)!.css === "none" ? "" : FILTERS.find(x => x.id === filter)!.css + " "}brightness(${brightness})`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} className="tap rounded-full bg-white/10 p-2"><X className="size-5" /></button>
        <div className="font-display text-sm uppercase tracking-wider opacity-80">Profilbild</div>
        <button
          onClick={save}
          disabled={!src || busy}
          className="tap flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-display text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Speichern
        </button>
      </div>

      {/* Stage */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          className="relative aspect-square w-full max-w-[420px] touch-none select-none overflow-hidden rounded-full border-4 border-white/15"
          style={{ background: "#0b0b10" }}
        >
          {src ? (
            <>
              <img
                src={src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                style={{
                  transform: `translate(calc(-50% + ${offset.x * 100}%), calc(-50% + ${offset.y * 100}%)) rotate(${rotate}deg) scale(${scale})`,
                  height: "100%",
                  filter: filterCss,
                }}
              />
              {stickers.map(s => (
                <div
                  key={s.id}
                  data-sticker-id={s.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab font-display font-extrabold ${activeId === s.id ? "ring-2 ring-primary/80 rounded-md" : ""}`}
                  style={{
                    left: `${s.x * 100}%`, top: `${s.y * 100}%`,
                    fontSize: s.kind === "emoji" ? `${48 * s.scale}px` : `${28 * s.scale}px`,
                    color: s.color,
                    textShadow: s.kind === "text" ? "0 2px 8px rgba(0,0,0,.55)" : "none",
                    padding: "2px 6px",
                  }}
                >
                  {s.value}
                </div>
              ))}
            </>
          ) : (
            <button
              onClick={() => fileInput.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70"
            >
              <ImagePlus className="size-10" />
              <span className="font-display text-sm uppercase tracking-wider">Foto auswählen</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters strip */}
      {src && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-2xl border px-3 py-1.5 text-xs font-semibold ${filter === f.id ? "border-primary bg-primary text-primary-foreground" : "border-white/15 bg-white/5 text-white/80"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Brightness */}
          <div className="mt-2 flex items-center gap-3">
            <span className="w-16 text-[10px] uppercase tracking-wider opacity-60">Helligkeit</span>
            <input
              type="range" min={0.5} max={1.6} step={0.01} value={brightness}
              onChange={e => setBrightness(parseFloat(e.target.value))}
              className="flex-1 accent-[color:var(--primary)]"
            />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-around gap-2 px-4 pb-3 pt-3">
        <ToolBtn onClick={() => fileInput.current?.click()} icon={<ImagePlus className="size-5" />} label="Foto" />
        <ToolBtn onClick={() => setRotate(r => (r + 90) % 360)} icon={<RotateCw className="size-5" />} label="Drehen" disabled={!src} />
        <ToolBtn onClick={addText} icon={<Type className="size-5" />} label="Text" disabled={!src} />
        <ToolBtn onClick={() => setShowEmoji(v => !v)} icon={<Smile className="size-5" />} label="Emoji" disabled={!src} active={showEmoji} />
        <ToolBtn onClick={removeActive} icon={<Trash2 className="size-5" />} label="Löschen" disabled={!activeId} />
      </div>

      {/* Emoji & color tray */}
      {showEmoji && (
        <div className="border-t border-white/10 bg-black/60 px-4 py-3">
          <div className="grid grid-cols-8 gap-2">
            {EMOJIS.map(em => (
              <button key={em} onClick={() => addEmoji(em)} className="rounded-xl bg-white/5 py-2 text-2xl">{em}</button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider opacity-60">Textfarbe</span>
            {STICKER_COLORS.map(c => (
              <button key={c} onClick={() => setTextColor(c)}
                className={`size-6 rounded-full border-2 ${textColor === c ? "border-white" : "border-white/20"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}

      <input ref={fileInput} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
    </div>
  );
}

function ToolBtn({ icon, label, onClick, disabled, active }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`tap flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] uppercase tracking-wider disabled:opacity-30 ${active ? "bg-white/15" : "bg-white/5"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
