"use client";

import React, { useState } from "react";
import { Clock, X } from "lucide-react";
import { useGetPosOpeningStatusQuery } from "@/app/redux/api";

export default function StoreStatusBanner() {
  const { data: openEntries, isLoading, isError } = useGetPosOpeningStatusQuery(
    undefined,
    {
      pollingInterval: 60000, // Poll every minute to stay accurate
    }
  );

  const [dismissed, setDismissed] = useState(false);

  // While loading initial query or if dismissed by user for the session, don't show
  if (isLoading || isError || dismissed) {
    return null;
  }

  const isOpen = Array.isArray(openEntries) && openEntries.length > 0;

  if (isOpen) {
    return (
      <aside
        aria-label="Store open status"
        className="relative z-40 flex items-center justify-between border-b border-emerald-100 bg-emerald-50/90 px-4 py-1.5 text-xs text-emerald-800 transition-all backdrop-blur-xs"
      >
        <div className="mx-auto flex items-center justify-center gap-2 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold tracking-wide">Open Now</span>
          <span className="hidden text-emerald-600 sm:inline">·</span>
          <span className="hidden text-emerald-700 sm:inline">
            Accepting online orders for fast delivery & pickup
          </span>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss store status banner"
          className="ml-2 rounded-md p-1 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
        >
          <X size={13} />
        </button>
      </aside>
    );
  }

  // When Closed (No open POS entry for profile "website" in past day)
  return (
    <aside
      aria-label="Store closed notice"
      className="relative z-40 border-b border-amber-200/80 bg-linear-to-r from-amber-50 via-rose-50 to-amber-50 px-4 py-2.5 text-xs text-stone-800 shadow-xs"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock size={13} className="animate-pulse" />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Currently Closed
            </span>
            <span className="font-medium text-stone-700">
              We are not accepting online orders at the moment. Please check back later.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
          className="shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-200/50 hover:text-stone-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
