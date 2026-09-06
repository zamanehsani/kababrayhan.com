"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowLeft,
  Receipt,
} from "lucide-react";
import BottomNav from "../components/home/BottomNav";
import { useEffect } from "react";
import { Suspense } from "react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const orderName = searchParams.get("order") || "";

  useEffect(() => {
    localStorage.removeItem("cart");
    localStorage.removeItem("pending_sales_order");
    localStorage.removeItem("sales_order");
    localStorage.removeItem("stripe_client_secret");
  }, []);

  return (
    <div className="flex flex-col items-center text-center">

      {/* Minimalist Success Icon Plate */}
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-pulse rounded-full bg-red-500/10" />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-red-100 shadow-sm">
          <CheckCircle2
            size={28}
            strokeWidth={1.5}
            className="text-red-500"
          />
        </div>
      </div>

      {/* Clean Balanced Typography Hierarchy */}
      <h1 className="text-3xl font-medium tracking-wide text-slate-900 lg:text-4xl">
        Thank you for your order.
      </h1>

      {orderName ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50/70 px-4 py-1.5 text-xs font-semibold text-red-700">
          <Receipt size={14} className="text-red-500" />
          <span>Order #{orderName} Received</span>
        </div>
      ) : null}

      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 font-medium">
        We have received your order. Our kitchen is preparing your items and
        will have them delivered to you shortly.
      </p>

      {/* Premium CTA Buttons Track (Desktop / Tablet) */}
      <div className="hidden md:flex mt-8 w-full max-w-xs flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 h-12 px-6 text-sm font-semibold text-white shadow-md shadow-red-600/10 transition-all hover:bg-red-700 active:scale-[0.98]"
        >
          <ArrowLeft size={16} className="text-white" />
          <span>Return to Menu</span>
        </Link>
      </div>

      {/* Mobile CTA Buttons */}
      <div className="flex md:hidden mt-6 w-full flex-col gap-2 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-full bg-red-600 h-12 px-6 text-sm font-semibold text-white shadow-md shadow-red-600/10"
        >
          <ArrowLeft size={16} className="text-white" />
          <span>Return to Menu</span>
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <main className="flex flex-1 bg-slate-50/50 font-sans antialiased text-slate-800 flex flex-col">
      <section className="flex-grow w-full max-w-5xl mx-auto px-6 flex flex-col justify-center items-center py-10 pb-24 md:pb-12">
        <div className="grid grid-cols-1 gap-8 lg:gap-12 w-full items-center">
          <Suspense fallback={<div className="text-sm text-slate-400">Loading order details...</div>}>
            <ThankYouContent />
          </Suspense>
        </div>
      </section>

      {/* Bottom Nav Pad Footer */}
      <div className="flex-shrink-0 block md:hidden">
        <BottomNav />
      </div>
    </main>
  );
}
