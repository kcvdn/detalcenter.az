export default function SkeletonCard({ className = "" }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="skeleton-shimmer h-48 bg-slate-200" />

      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-4 w-5/6 rounded-full bg-slate-200" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-full bg-slate-200" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-6 w-1/3 rounded-full bg-slate-200" />
            <div className="skeleton-shimmer h-4 w-1/2 rounded-full bg-slate-100" />
          </div>

          <div className="skeleton-shimmer h-8 w-16 rounded-lg bg-slate-100" />
        </div>

        <div className="skeleton-shimmer h-12 w-full rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}
