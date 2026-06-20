import { useRef, useCallback } from "react";

/**
 * Returns a ref + props to attach to a horizontally-scrollable container
 * so it can be dragged with mouse/pen (touch already swipes natively).
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const state = useRef({ down: false, moved: false, startX: 0, startScroll: 0, pointerId: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    if (e.pointerType === "touch") return; // let native scroll handle it
    const el = ref.current;
    if (!el) return;
    state.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      pointerId: e.pointerId,
    };
    el.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const s = state.current;
    if (!s.down) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    el.scrollLeft = s.startScroll - dx;
  }, []);

  const endDrag = useCallback((e: React.PointerEvent<T>) => {
    const s = state.current;
    if (!s.down) return;
    const el = ref.current;
    el?.releasePointerCapture?.(s.pointerId);
    s.down = false;
    // Swallow the click that follows a drag, so cards inside don't navigate
    if (s.moved) {
      const swallow = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        window.removeEventListener("click", swallow, true);
      };
      window.addEventListener("click", swallow, true);
      setTimeout(() => window.removeEventListener("click", swallow, true), 100);
    }
  }, []);

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: endDrag,
      style: { touchAction: "pan-y" as const, cursor: "grab" as const },
    },
  };
}
