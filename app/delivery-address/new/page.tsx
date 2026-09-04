"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function NewDeliveryAddressPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={14} />
          Back to addresses
        </button>

        <h1 className="text-xl font-semibold tracking-wide text-slate-900">
          Add a new address
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Map picker and address form go here.
        </p>
      </div>
    </main>
  );
}
