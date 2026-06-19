import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Resolve a proof storage path (or legacy public URL) to a usable signed URL. */
export function useProofUrl(pathOrUrl?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!pathOrUrl) { setUrl(null); return; }
    // Extract path from a legacy public/signed URL if present
    let path = pathOrUrl;
    const marker = "/proofs/";
    const idx = pathOrUrl.indexOf(marker);
    if (idx >= 0) path = pathOrUrl.slice(idx + marker.length).split("?")[0];
    (async () => {
      const { data } = await supabase.storage.from("proofs").createSignedUrl(path, 60 * 60 * 24 * 7);
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    })();
    return () => { cancelled = true; };
  }, [pathOrUrl]);
  return url;
}
