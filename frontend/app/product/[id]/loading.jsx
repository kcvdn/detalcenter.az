import SkeletonBlock from "@/components/SkeletonBlock";

export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <div className="space-y-6">
        <SkeletonBlock className="h-5 w-36" />

        <div className="grid gap-6 rounded-[32px] bg-white p-6 shadow-sm lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <SkeletonBlock className="min-h-[320px] w-full rounded-[28px] lg:min-h-[540px]" />

          <div className="space-y-4">
            <SkeletonBlock className="h-10 w-4/5" />
            <SkeletonBlock className="h-8 w-40" />

            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-24 w-full" />
              <SkeletonBlock className="h-24 w-full" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-12 w-full rounded-xl" />
              <SkeletonBlock className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
          <SkeletonBlock className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    </main>
  );
}
