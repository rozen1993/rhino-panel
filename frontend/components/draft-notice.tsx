import { Button } from "@/components/button";

export function DraftNotice({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  return (
    <section aria-live="polite" className="rounded-[5px] border border-amber bg-amber/20 p-3">
      <p className="text-sm font-bold">Guardado en este teléfono</p>
      <p className="mt-1 text-sm text-observed">Todavía no llegó al servidor</p>
      <Button className="mt-3 w-full" disabled={retrying} onClick={onRetry} variant="secondary">{retrying ? "Reintentando…" : "Reintentar"}</Button>
    </section>
  );
}
