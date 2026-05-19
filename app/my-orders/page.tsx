"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, RefreshCw } from "lucide-react";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import CartSidebarWidget from "../components/Cart/CartSidebarWidget";
import { useGetCustomerSalesOrdersQuery } from "../redux/api";
import { CART_UPDATED } from "../lib/cart";
import {
  CUSTOMER_PORTAL_UPDATED,
  readCustomerPortalSnapshot,
} from "../lib/customerPortal";
import type { SalesOrderSummary } from "../redux/apiType";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(amount);

export default function MyOrdersPage() {
  const router = useRouter();
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetCustomerSalesOrdersQuery(portalState.phone, {
      skip: !portalState.isVerified || !portalState.phone,
    });

  const orders = useMemo(() => {
    return [...(data ?? [])].sort((a: SalesOrderSummary, b: SalesOrderSummary) => {
      const aTime = new Date(a.transaction_date).getTime();
      const bTime = new Date(b.transaction_date).getTime();
      return bTime - aTime;
    });
  }, [data]);

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener(CART_UPDATED, refreshPortalState);
    globalThis.addEventListener("storage", refreshPortalState);

    return () => {
      globalThis.removeEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
      globalThis.removeEventListener(CART_UPDATED, refreshPortalState);
      globalThis.removeEventListener("storage", refreshPortalState);
    };
  }, [refreshPortalState]);

  return (
    <main className="min-h-screen bg-white pb-32 font-sans text-slate-900">
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <div className="hidden md:block lg:hidden">
        <TabletHeader />
      </div>

      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
              Orders
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">
              My Orders
            </h1>
          </div>

          {portalState.isVerified && (
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </div>

        {!portalState.isVerified && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">
              Verify your phone from Portal to view your order history.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
            >
              Go To Dashboard
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {portalState.isVerified && isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Loading orders...</p>
          </div>
        )}

        {portalState.isVerified && isError && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 shadow-sm">
            <p className="text-sm text-red-700">
              Could not fetch your orders right now. Try again.
            </p>
          </div>
        )}

        {portalState.isVerified && !isLoading && !isError && orders.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <ClipboardList size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold">No orders yet</p>
                <p className="text-xs text-slate-500">
                  Your completed or active orders will appear here.
                </p>
              </div>
            </div>
          </div>
        )}

        {portalState.isVerified && !isLoading && !isError && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                key={order.name}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Order ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {order.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(order.transaction_date).toLocaleDateString("en-AE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                      {order.status}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {formatCurrency(order.grand_total)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
      <CartSidebarWidget />
    </main>
  );
}
