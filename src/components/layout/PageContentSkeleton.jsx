/**
 * Mid-pane placeholder shown while a page waits on its APIs.
 * Keeps layout height stable so the shell does not stretch/snap.
 */
export function PageContentSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-slate-300/90" />
        <div className="h-4 w-72 max-w-full rounded-md bg-slate-300/70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="h-3 w-20 rounded bg-slate-300/80" />
            <div className="mt-4 h-7 w-16 rounded bg-slate-300/90" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          <div className="h-4 w-28 rounded bg-slate-300/80" />
          <div className="h-4 w-24 rounded bg-slate-300/70" />
          <div className="h-4 w-32 rounded bg-slate-300/70" />
          <div className="ml-auto h-4 w-20 rounded bg-slate-300/70" />
        </div>
        <div className="divide-y divide-border/70">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-9 w-9 shrink-0 rounded-full bg-slate-300/90" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-40 max-w-[50%] rounded bg-slate-300/90" />
                <div className="h-3 w-24 max-w-[35%] rounded bg-slate-300/70" />
              </div>
              <div className="hidden h-3 w-28 rounded bg-slate-300/70 sm:block" />
              <div className="hidden h-3 w-20 rounded bg-slate-300/70 md:block" />
              <div className="h-3 w-16 rounded bg-slate-300/70" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
