import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const STORAGE_KEY = "komma:last-location-ts";
const MIN_INTERVAL_MS = 1000 * 60 * 30; // 30 min

/** Asks browser for geolocation once per session window and persists to profile. */
export function useTrackLocation() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await (supabase as any).rpc("update_my_location", {
            _lat: pos.coords.latitude,
            _lng: pos.coords.longitude,
          });
          localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
      },
      () => {
        /* user denied – fine, falls back to no location */
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 10 },
    );
  }, [user?.id]);
}
