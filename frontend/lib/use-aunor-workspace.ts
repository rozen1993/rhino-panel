"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAunorWorkspaceAction } from "@/app/aunor/actions";
import type { AunorWorkspace } from "@/lib/aunor";
import type { AunorReadScene } from "@/lib/aunor-read-scope";

export function useAunorWorkspace(initial: AunorWorkspace, scene: AunorReadScene, id: string) {
  const [w, setW] = useState(initial);
  const [error, setError] = useState("");
  const active = useRef(true);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const mutating = useRef(false);
  const lastAttempt = useRef(0);
  const servicesLoadedAt = useRef(0);

  // Component-local reuse only: never a shared server cache or localStorage.
  // A new account/route gets a new component instance and fresh authorized data.
  const refresh = useCallback((forceServices = false): Promise<boolean> => {
    if (inFlight.current) return inFlight.current;
    lastAttempt.current = Date.now();
    const includeServices = forceServices || Date.now() - servicesLoadedAt.current >= 300_000;
    const request = (async () => {
      try {
        const result = await getAunorWorkspaceAction({scene,...(id ? {id} : {}),includeServices});
        if (!active.current) return false;
        if (!result.ok) { setError(result.error); return false; }
        setW(previous => {
          const next = {...result.data,services:includeServices ? result.data.services : previous.services};
          return JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
        });
        if (includeServices) servicesLoadedAt.current = Date.now();
        setError("");
        return true;
      } catch {
        if (active.current) setError("No se pudo actualizar la información. Reintenta cuando vuelva la conexión.");
        return false;
      } finally { inFlight.current = null; }
    })();
    inFlight.current = request;
    return request;
  }, [scene,id]);

  const beginMutation = useCallback(async () => {
    if (mutating.current) return false;
    mutating.current = true;
    // Finish older reads before saving, so they cannot overwrite a confirmation.
    await inFlight.current;
    return active.current;
  }, []);
  const endMutation = useCallback(() => { mutating.current = false; }, []);

  useEffect(() => {
    active.current = true;
    lastAttempt.current = Date.now();
    servicesLoadedAt.current = Date.now();
    const poll = () => {
      if (document.visibilityState !== "visible" || mutating.current || Date.now() - lastAttempt.current < 25_000) return;
      void refresh();
    };
    const timer = setInterval(poll,30_000);
    window.addEventListener("focus",poll);
    return () => { active.current = false; clearInterval(timer); window.removeEventListener("focus",poll); };
  }, [refresh]);

  return {w,error,setError,refresh,beginMutation,endMutation};
}
