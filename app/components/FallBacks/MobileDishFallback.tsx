"use client";
import { WifiOff, RefreshCw } from "lucide-react";

interface MobileDishFallbackProps {
  onRetry?: () => void;
}

export function MobileDishFallback({ onRetry }: MobileDishFallbackProps) {
  return (
    <div className="mx-4 flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-100 bg-slate-50/70 px-5 py-14 text-center">
      {/* Icon Container */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <WifiOff size={22} className="text-slate-400" />
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-semibold tracking-wide text-slate-800">
          Unable to load dishes
        </h4>
        <p className="text-xs leading-relaxed text-slate-500">
          We couldn&apos;t reach the menu right now.
          <br />
          Check your connection and try again.
        </p>
      </div>

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-slate-700 active:scale-95"
        >
          <RefreshCw size={12} />
          Try again
        </button>
      )}
    </div>
  );
}
