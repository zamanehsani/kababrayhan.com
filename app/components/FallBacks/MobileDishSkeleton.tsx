export function MobileDishSkeleton() {
  return (
    <div>
      {/* Group label placeholder */}
      <div className="mb-3 px-4">
        <div className="h-3.5 w-20 animate-pulse rounded-lg bg-slate-200" />
      </div>

      {/* 2-column card grid */}
      <div className="grid grid-cols-2 gap-4 px-2">
        {["a", "b", "c", "d", "e", "f"].map((id) => (
          // eslint-disable-next-line react/no-array-index-key
          <div
            key={id}
            className="flex flex-col rounded-[2rem] bg-slate-100 p-3"
          >
            {/* Title lines */}
            <div className="mb-1 flex flex-col gap-1.5">
              <div className="h-3.5 w-3/4 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-3.5 w-1/2 animate-pulse rounded-lg bg-slate-200" />
            </div>

            {/* Image placeholder */}
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-slate-200" />

            {/* Bottom row */}
            <div className="mt-2 flex items-center justify-between">
              <div className="h-4 w-12 animate-pulse rounded-full bg-slate-200" />
              <div className="h-5 w-10 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
