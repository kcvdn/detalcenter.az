export default function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-2xl bg-slate-200/80 ${className}`.trim()}
    />
  );
}
