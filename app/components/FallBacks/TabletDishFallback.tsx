"use client";
import { WifiOff, RefreshCw } from "lucide-react";

interface TabletDishFallbackProps {
  onRetry?: () => void;
}

export function TabletDishFallback({ onRetry }: Readonly<TabletDishFallbackProps>) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-slate-100 bg-slate-50/70 px-6 py-20 text-center">
      {/* Icon Container */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <WifiOff size={26} className="text-slate-400" />
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-1.5">
        <h4 className="text-lg font-semibold tracking-wide text-slate-800">
          Unable to load dishes
        </h4>
        <p className="mx-auto max-w-xs text-sm leading-relaxed text-slate-500">
          We couldn&apos;t reach the menu right now. Check your internet
          connection and give it another try.
        </p>
      </div>

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-700 active:scale-95"
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}
