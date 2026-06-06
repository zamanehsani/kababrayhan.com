"use client";

import Link from "next/link";
import { ChevronLeft, Scale, ShieldAlert, FileText, HelpCircle } from "lucide-react";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import CartSidebarWidget from "../components/Cart/CartSidebarWidget";
import Footer from "../components/Footer/Footer";

export default function TermsConditionsPage() {
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
                Legal Agreements
              </p>
              <h1 className="mt-2 text-xl font-normal leading-wide text-slate-900 sm:text-2xl lg:text-3xl">
                Terms & Conditions
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
            <p className="italic bg-slate-100 border-l-4 border-slate-400 p-4 rounded-r-2xl text-slate-700">
              Welcome to our platform. By accessing our services, creating an account, or placing food orders, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>

            {/* Section 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                  <Scale size={16} />
                </div>
                <h2>1. Account Profile Security</h2>
              </div>
              <p className="pl-9">
                When register on our platform via your phone number, you are fully responsible for maintaining the privacy of your session and OTP login codes. Any actions, food purchases, or updates made to delivery profile structures under your authenticated identifier are your clear accountability.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 shrink-0">
                  <FileText size={16} />
                </div>
                <h2>2. Food Ordering & Allergies</h2>
              </div>
              <p className="pl-9">
                We present items and customization fields on our menu interface. If you have severe medical constraints or diet thresholds, you must explicitly input details into the <span className="font-semibold text-slate-800">Customer Note</span> container prior to checkout submission. While our staff reviews instructions diligently, we cannot guarantee absolute absolute pathogen or ingredient-free cross-contamination separation.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <h2>3. Delivery & Fulfillment Logistics</h2>
              </div>
              <p className="pl-9">
                Orders are processed and dispatched directly using coordinates saved inside your configured Address management section. If delivery coordinates are entered inaccurately by the user, we hold no liability for lost parcels or dispatch completion delays.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base sm:text-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <HelpCircle size={16} />
                </div>
                <h2>4. Amendments & Termination</h2>
              </div>
              <p className="pl-9">
                We maintain full operational rights to update code configurations, price parameters, or legal terms at any moment. Continued interaction with our platform following a published amendment cycle indicates binding agreement to the revised conditions.
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