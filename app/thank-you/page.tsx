"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ArrowLeft,
  ReceiptText,
} from "lucide-react";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import Footer from "../components/Footer/Footer";

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-800 flex flex-col">
      {/* ── Headers Track ───────────────────────────────── */}
      <div className="flex-shrink-0">
        <div className="block md:hidden">
          <MobileHeader />
        </div>
        <div className="hidden md:block lg:hidden">
          <TabletHeader />
        </div>
        <div className="hidden lg:block">
          <DesktopHeader />
        </div>
      </div>

      {/* ── Main Single-View Workspace Container ────────── */}
      <section className="flex-grow w-full max-w-5xl mx-auto px-6 flex flex-col justify-center items-center py-10 pb-24 md:pb-12">
        {/* Two Column Grid layout to eliminate scrolling requirement on desktop / tablet viewports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 w-full items-center">
          {/* Left Column Area: Hero Status Visuals */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            {/* Minimalist Success Icon Plate */}
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/10" />
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-emerald-100 shadow-sm">
                <CheckCircle2
                  size={28}
                  strokeWidth={1.5}
                  className="text-emerald-500"
                />
              </div>
            </div>

            {/* Elegant Calm Status Badge */}
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/60 px-3.5 py-1 text-xs font-semibold text-emerald-700 tracking-wide">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              Payment Successful
            </span>

            {/* Clean Balanced Typography Hierarchy */}
            <h1 className="text-3xl font-medium tracking-wide text-slate-900 lg:text-4xl">
              Thank you for <br />
              your order
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500 font-medium">
              Your order has been verified successfully. Our kitchen is
              preparing your items and will have them ready shortly.
            </p>

            {/* Premium CTA Buttons Track (Hidden on Mobile Viewport, shown below layout columns for mobile) */}
            <div className="hidden md:flex mt-8 w-full max-w-sm flex-col sm:flex-row gap-3">
              <Link
                href="/my-orders"
                className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 h-12 px-4 text-xs font-semibold text-white shadow-md shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.98]"
              >
                <span>Track My Order</span>
                <ChevronRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <Link
                href="/"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white h-12 px-4 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              >
                <ArrowLeft size={14} className="text-slate-400" />
                <span>Return to Menu</span>
              </Link>
            </div>
          </div>

          {/* Right Column Area: Structured Document Info Cards Info Tracking */}
          <div className="flex flex-col gap-3 justify-center">
            <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 lg:p-5 shadow-sm transition-all hover:border-slate-200">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                <ReceiptText size={18} strokeWidth={2} />
              </span>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-slate-900">
                  Order Confirmed
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 leading-normal">
                  A digital receipt and live production invoice have been logged
                  into your profile dashboard workspace.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 lg:p-5 shadow-sm transition-all hover:border-slate-200">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-100/60">
                <ClipboardList size={18} strokeWidth={2} />
              </span>
              <div className="flex-grow">
                <p className="text-sm font-semibold text-slate-900">
                  Live Kitchen Tracking
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 leading-normal">
                  You can view the dynamic real-time preparation status changes
                  directly through the active operations console.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fallback Button Block Layout (Renders underneath content blocks only on small screens) */}
        <div className="flex md:hidden mt-6 w-full flex-col gap-2 flex-shrink-0">
          <Link
            href="/my-orders"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 h-11 px-6 text-xs font-semibold text-white shadow-md shadow-slate-900/10"
          >
            <span>Track My Order</span>
            <ChevronRight size={14} />
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white h-11 px-6 text-xs font-semibold text-slate-700"
          >
            <span>Return to Menu</span>
          </Link>
        </div>
      </section>

      {/* ── Bottom Nav Pad Footer ────────────────────────── */}
      <div className="flex-shrink-0 block md:hidden">
        <BottomNav />
      </div>

      {/* ── Site Footer (Tablet + Desktop only) ─────────── */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </main>
  );
}
