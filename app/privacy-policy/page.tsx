"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Database, Smartphone, Eye } from "lucide-react";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import CartSidebarWidget from "../components/Cart/CartSidebarWidget";
import Footer from "../components/Footer/Footer";

export default function PrivacyPolicyPage() {
  const lastUpdated = "June 2026";

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Structural Headers matching your platform layout */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>
      <div className="hidden md:block lg:hidden">
        <TabletHeader />
      </div>
      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Navigation & Header Panel */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-orange-50/50 p-6 shadow-sm shadow-slate-200/40 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-600">
                Data Protection
              </p>
              <h1 className="mt-2 text-xl font-normal leading-wide text-slate-900 sm:text-2xl lg:text-3xl">
                Privacy Policy
              </h1>
              <p className="mt-2 text-xs text-slate-500 font-medium">
                Last updated: {lastUpdated}
              </p>
            </div>

            <Link
              href="/home"
              className="inline-flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft size={14} />
              Back To Home
            </Link>
          </div>

          {/* Interactive Document Body */}
          <div className="mt-8 space-y-8 text-slate-600 text-sm leading-relaxed sm:text-[15px]">
            <p className="text-slate-700 font-medium">
              Your safety and data privacy are foundational priorities. This Privacy Policy details exactly how we securely extract, cache, sync, and process metrics when you utilize our online services.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                  <Smartphone size={16} />
                </div>
                <h2>1. Information We Securely Collect</h2>
              </div>
              <p className="pl-9">
                To fulfill online kitchen orders effectively, we store information parameters including your verified mobile phone identity, delivery address records, custom preparation/allergy metrics, and order purchase history logs.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 shrink-0">
                  <Database size={16} />
                </div>
                <h2>2. Caching & State Management</h2>
              </div>
              <p className="pl-9">
                For a seamless checkout experience across your tabs, address profiles are synced locally using web browser <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-red-600">localStorage</code> identifiers. Permanent information updates pass directly into an isolated, secure database architecture.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                  <Eye size={16} />
                </div>
                <h2>3. How Data is Shared</h2>
              </div>
              <p className="pl-9">
                We never trade or distribute customer contact references to third-party ad brokers. Access triggers are strictly limited to necessary dispatch handlers and logistics software components to ensure precise home delivery operations.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <h2>4. Your Access Control Options</h2>
              </div>
              <p className="pl-9">
                You have full control over your saved information. Through your Account Profile center, you can modify, add, or systematically delete address cards from the database at any time.
              </p>
            </div>

          </div>
        </div>
      </section>

      <BottomNav />
      <CartSidebarWidget />
      <Footer />
    </main>
  );
}