import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Resolve an avatar storage path to a usable URL (signed for 1 year). */
export function useAvatarUrl(pathOrUrl?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) { setUrl(null); return; }
    if (pathOrUrl.startsWith("http")) { setUrl(pathOrUrl); return; }
    (async () => {
      const { data } = await supabase.storage.from("avatars").createSignedUrl(pathOrUrl, 60 * 60 * 24 * 365);
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [pathOrUrl]);
  return url;
}
