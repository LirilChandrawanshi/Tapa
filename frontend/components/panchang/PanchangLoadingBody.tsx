/**
 * Generic pulsing placeholder for the dynamic content area below the hero +
 * subnav on any /panchang/* route's loading.tsx. The hero and subnav render
 * for real (same component, same props) so only this body pops in once data
 * resolves — avoids the hero/subnav flashing or reflowing between tabs.
 */
export function PanchangLoadingBody() {
  const block = "rounded-[13px] border border-border bg-card";
  return (
    <div className="mx-auto max-w-[1280px] animate-pulse px-4 py-7 md:px-10">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className={`h-9 w-[220px] rounded-[10px] ${block}`} />
        <div className={`h-9 w-[160px] rounded-[10px] ${block}`} />
        <div className={`ml-auto h-9 w-[200px] rounded-[10px] ${block}`} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-[90px] ${block}`} />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-[64px] ${block}`} />
        ))}
      </div>
    </div>
  );
}
