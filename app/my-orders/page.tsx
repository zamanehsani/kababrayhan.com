"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, RefreshCw } from "lucide-react";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import CartSidebarWidget from "../components/Cart/CartSidebarWidget";
import {
  useGetCustomerSalesOrdersQuery,
  useGetKitchenOrderTicketQuery,
} from "../redux/api";
import { CART_UPDATED } from "../lib/cart";
import {
  CUSTOMER_PORTAL_UPDATED,
  getCustomerName,
  readCustomerPortalSnapshot,
} from "../lib/customerPortal";
import type { SalesOrderSummary } from "../redux/apiType";
import Footer from "../components/Footer/Footer";

// kot?.status -> "Pending" | "Preparing" | "Ready" | "Completed"
const getKitchenStatusDisplay = (kotStatus?: string) => {
  switch (kotStatus?.toLowerCase()) {
    case "pending":
      return {
        label: "Order Received",
        color: "bg-blue-50 border-blue-200 text-blue-700",
      };
    case "preparing":
      return {
        label: "Being Prepared",
        color: "bg-yellow-50 border-red-200 text-red-700",
      };
    case "ready":
      return {
        label: "Ready",
        color: "bg-green-50 border-green-200 text-green-700",
      };
    case "completed":
      return {
        label: "Delivered",
        color: "bg-slate-50 border-slate-200 text-slate-700",
      };
    default:
      return {
        label: "Processing",
        color: "bg-slate-50 border-slate-200 text-slate-700",
      };
  }
};

const KITCHEN_PROGRESS_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Cooking" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
] as const;

const getKitchenProgressIndex = (kotStatus?: string) => {
  switch (kotStatus?.toLowerCase()) {
    case "pending":
      return 0;
    case "preparing":
      return 1;
    case "ready":
      return 2;
    case "completed":
      return 3;
    default:
      return 0;
  }
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2,
  }).format(amount);

function OrderKitchenStatus({ kotId }: Readonly<{ kotId?: string }>) {
  const { data: kotDetails } = useGetKitchenOrderTicketQuery(kotId || "", {
    skip: !kotId,
    pollingInterval: 30000, // Auto-refresh every 30 seconds
  });

  const statusDisplay = getKitchenStatusDisplay(kotDetails?.status);
  const activeStepIndex = getKitchenProgressIndex(kotDetails?.status);
  const progressPercent =
    (activeStepIndex / (KITCHEN_PROGRESS_STEPS.length - 1)) * 100;

  return (
    <div className="w-full max-w-full sm:ml-auto sm:max-w-88">
      <div className="flex justify-start sm:justify-end">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusDisplay.color}`}
        >
          {statusDisplay.label}
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-4">
        <ol className="space-y-3 sm:hidden">
          {KITCHEN_PROGRESS_STEPS.map((step, index) => {
            const isReached = index <= activeStepIndex;
            const isCurrent = index === activeStepIndex;
            const isLast = index === KITCHEN_PROGRESS_STEPS.length - 1;

            return (
              <li key={step.key} className="relative pl-7">
                {!isLast && (
                  <span
                    className={`absolute left-2 top-4 h-6 w-0.5 ${
                      index < activeStepIndex ? "bg-red-300" : "bg-slate-200"
                    }`}
                  />
                )}

                <span
                  className={`absolute left-0 top-0.5 inline-flex h-4 w-4 rounded-full border-2 transition-colors ${
                    isReached
                      ? "border-red-600 bg-red-600"
                      : "border-slate-300 bg-white"
                  } ${isCurrent ? "ring-2 ring-red-100" : ""}`}
                />

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isReached ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>

                  {isCurrent && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">
                      Current
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="relative hidden sm:block">
          <div className="absolute left-3 right-3 top-2 h-1 rounded-full bg-slate-200" />
          <div
            className="absolute left-3 top-2 h-1 rounded-full bg-red-600 transition-all duration-500"
            style={{
              width: `calc((100% - 1.5rem) * ${progressPercent / 100})`,
            }}
          />

          <div className="relative grid grid-cols-4 gap-2">
            {KITCHEN_PROGRESS_STEPS.map((step, index) => {
              const isReached = index <= activeStepIndex;
              const isCurrent = index === activeStepIndex;

              return (
                <div
                  key={step.key}
                  className="flex min-w-0 flex-col items-center text-center"
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${
                      isReached
                        ? "border-red-600 bg-red-600"
                        : "border-slate-300 bg-white"
                    } ${isCurrent ? "scale-110 ring-2 ring-red-100" : ""}`}
                  />
                  <span
                    className={`mt-2 text-[9px] font-semibold uppercase tracking-wide ${
                      isReached ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const stableCustomerName = getCustomerName() || portalState.phone;

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetCustomerSalesOrdersQuery(stableCustomerName, {
      skip: !portalState.isVerified || !stableCustomerName,
      pollingInterval: 30000, // Auto-refresh every 30 seconds for live updates
    });

  const orders = useMemo(() => {
    return [...(data ?? [])].sort(
      (a: SalesOrderSummary, b: SalesOrderSummary) => {
        const creationA = Date.parse(a.creation ?? "");
        const creationB = Date.parse(b.creation ?? "");

        if (Number.isFinite(creationA) && Number.isFinite(creationB)) {
          return creationB - creationA;
        }

        const aTime = Date.parse(a.transaction_date);
        const bTime = Date.parse(b.transaction_date);

        if (Number.isFinite(aTime) && Number.isFinite(bTime)) {
          return bTime - aTime;
        }

        return b.name.localeCompare(a.name);
      }
    );
  }, [data]);

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener(CART_UPDATED, refreshPortalState);
    globalThis.addEventListener("storage", refreshPortalState);

    return () => {
      globalThis.removeEventListener(
        CUSTOMER_PORTAL_UPDATED,
        refreshPortalState
      );
      globalThis.removeEventListener(CART_UPDATED, refreshPortalState);
      globalThis.removeEventListener("storage", refreshPortalState);
    };
  }, [refreshPortalState]);

  return (
    <>
      <main className="min-h-screen bg-white  font-sans text-slate-900 ">
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
              <h1 className="mt-1 text-xl font-normal text-slate-900">
                My Orders
              </h1>
            </div>

            {portalState.isVerified && (
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50"
                aria-label="Refresh order status"
              >
                <RefreshCw
                  size={14}
                  className={isFetching ? "animate-spin" : ""}
                />
                Update Status
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
                Go To Home
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

          {portalState.isVerified &&
            !isLoading &&
            !isError &&
            orders.length === 0 && (
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

          {portalState.isVerified &&
            !isLoading &&
            !isError &&
            orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => (
                  <article
                    key={order.name}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Order ID
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {order.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(order.transaction_date).toLocaleDateString(
                            "en-AE",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>

                      <div className="w-full sm:w-auto sm:text-right">
                        <OrderKitchenStatus
                          kotId={order.custom_kitchen_order_ticket}
                        />
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
      <Footer />
    </>
  );
}
