"use client";
import { WifiOff, RefreshCw } from "lucide-react";

interface DesktopDishFallbackProps {
  onRetry?: () => void;
}

export function DesktopDishFallback({ onRetry }: DesktopDishFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-slate-100 bg-slate-50/70 px-6 py-24 text-center">
      {/* Icon Container */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <WifiOff size={32} className="text-slate-400" />
      </div>

      {/* Copy */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xl font-semibold tracking-wide text-slate-800">
          Unable to load dishes
        </h4>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
          We couldn&apos;t reach the menu right now. Check your internet
          connection and give it another try.
        </p>
      </div>

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-700 active:scale-95"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}
