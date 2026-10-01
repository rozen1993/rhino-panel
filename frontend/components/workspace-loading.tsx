/** Keeps the authenticated shell usable while the private data streams in. */
export function WorkspaceLoading({ label }: { label: string }) {
  return (
    <section role="status" aria-label={label} aria-busy="true" className="rounded-xl border border-line bg-panel p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <div aria-hidden="true" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-28 rounded-lg border border-line bg-cyan/[.04] motion-safe:animate-pulse" />
        ))}
      </div>
    </section>
  );
}
