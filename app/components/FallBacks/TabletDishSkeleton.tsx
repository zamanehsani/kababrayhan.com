export function TabletDishSkeleton() {
  return (
    <div>
      {/* Group label placeholder */}
      <div className="mb-4">
        <div className="h-4 w-24 animate-pulse rounded-lg bg-slate-200" />
      </div>

      {/* 3-column card grid */}
      <div className="grid grid-cols-3 gap-5">
        {["a", "b", "c", "d", "e", "f"].map((id) => (
          // eslint-disable-next-line react/no-array-index-key
          <div
            key={id}
            className="flex flex-col rounded-[2rem] bg-slate-100 p-3"
          >
            {/* Title lines */}
            <div className="mb-1 flex flex-col gap-1.5">
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-200" />
            </div>

            {/* Image placeholder */}
            <div className="my-1 aspect-square w-full animate-pulse rounded-2xl bg-slate-200" />

            {/* Bottom row */}
            <div className="mt-auto flex items-center justify-between pt-1">
              <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200" />
              <div className="h-6 w-12 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
