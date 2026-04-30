import SkeletonBlock from "@/components/SkeletonBlock";
import SkeletonCard from "@/components/SkeletonCard";

export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-4">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="h-16 w-full max-w-xl rounded-3xl" />
              <SkeletonBlock className="h-4 w-full max-w-md" />
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-14 w-48 rounded-2xl" />
            </div>

            <SkeletonBlock className="h-[280px] w-full rounded-[28px] md:h-[360px] lg:h-[440px]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
