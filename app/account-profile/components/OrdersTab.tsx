"use client";

import { useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";
import type { SalesOrderDetails, SalesOrderSummary } from "@/app/redux/apiType";
import { useGetSalesOrderQuery } from "@/app/redux/api";

type OrdersTabProps = {
  orders: SalesOrderSummary[];
  isLoading?: boolean;
  onRefresh?: () => void;
  formatCurrency: (amount: number) => string;
};

const getStatusBadge = (status?: string, docstatus?: number) => {
  if (docstatus === 2 || status === "Cancelled") {
    return {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 border border-rose-200",
    };
  }
  if (status === "Completed" || status === "Paid") {
    return {
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    };
  }
  if (status === "To Deliver and Bill" || status === "To Deliver") {
    return {
      label: "Confirmed",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    };
  }
  if (status === "Draft" || docstatus === 0) {
    return {
      label: "Draft",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    };
  }
  return {
    label: status || "Processing",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  };
};

const getPaymentMethodLabel = (method?: string, status?: string) => {
  if (method === "card_online") return "Online Payment (Card)";
  if (method === "card_on_delivery") return "Card on Delivery";
  if (method === "cash_on_delivery") return "Cash on Delivery";
  if (method) return method.replace(/_/g, " ");
  if (status === "Paid") return "Paid";
  return "Doorstep / Counter";
};

const formatCleanAddress = (rawAddress?: string): string => {
  if (!rawAddress) return "Delivery Address";

  // Replace HTML breaks, paragraphs, and tags with commas
  const stripped = rawAddress
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<\/?[^>]+(>|$)/g, ", ");

  // Tokenize by comma or newline
  const tokens = stripped
    .split(/[,\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  // Deduplicate tokens (case-insensitive) while preserving order
  const uniqueTokens: string[] = [];
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (!uniqueTokens.some((item) => item.toLowerCase() === normalized)) {
      uniqueTokens.push(token);
    }
  }

  return uniqueTokens.join(", ") || "Delivery Address";
};

export default function OrdersTab({
  orders,
  isLoading = false,
  onRefresh,
  formatCurrency,
}: OrdersTabProps) {
  const [selectedOrderName, setSelectedOrderName] = useState<string | null>(null);
  const { data: selectedOrderDetails, isLoading: isLoadingDetails } =
    useGetSalesOrderQuery(selectedOrderName || "", {
      skip: !selectedOrderName,
    });

  const rawAddress =
    (
      selectedOrderDetails as
        | (SalesOrderDetails & { customer_address?: string; address_display?: string; shipping_address?: string })
        | undefined
    )?.address_display ||
    (
      selectedOrderDetails as
        | (SalesOrderDetails & { customer_address?: string; shipping_address?: string })
        | undefined
    )?.shipping_address ||
    (
      selectedOrderDetails as
        | (SalesOrderDetails & { customer_address?: string })
        | undefined
    )?.customer_address ||
    "";

  const selectedOrderAddress = formatCleanAddress(rawAddress);

  return (
    <>
      <div className="py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Order History</p>
              <p className="text-xs text-slate-500">
                {orders.length} {orders.length === 1 ? "order" : "orders"} placed
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
              aria-label="Refresh order history"
              title="Refresh order history"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex justify-between">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </div>
                  <div className="mt-4 flex justify-between border-t border-slate-100 pt-3">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-3 w-16 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
                <ShoppingBag size={28} />
              </div>
              <h4 className="mt-3 text-base font-semibold text-slate-800">
                No orders placed yet
              </h4>
              <p className="mt-1 text-sm text-slate-500">
                When you place food delivery orders, they will appear right here.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const statusBadge = getStatusBadge(order.status, order.docstatus);
              const formattedDate = order.transaction_date
                ? new Date(order.transaction_date).toLocaleDateString("en-AE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : order.creation
                ? new Date(order.creation).toLocaleDateString("en-AE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Recent";

              return (
                <button
                  key={order.name}
                  type="button"
                  onClick={() => setSelectedOrderName(order.name)}
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {order.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {getPaymentMethodLabel(
                            order.custom_payment_method,
                            order.custom_payment_status || order.status
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:flex-col sm:items-end">
                      <p className="text-xs text-slate-500 sm:hidden">Total</p>
                      <p className="text-base font-bold text-slate-900">
                        {formatCurrency(order.grand_total)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} className="text-slate-400" />
                      {formattedDate}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600 transition group-hover:underline">
                      View Details
                      <ReceiptText size={13} />
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedOrderName && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Order Details
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                  {selectedOrderName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderName(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                aria-label="Close order details"
              >
                <X size={18} />
              </button>
            </div>

            {isLoadingDetails || !selectedOrderDetails ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-red-600" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading order summary...
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-6">
                {/* Status bar */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {selectedOrderDetails.transaction_date
                        ? new Date(
                            selectedOrderDetails.transaction_date
                          ).toLocaleDateString("en-AE", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          getStatusBadge(
                            selectedOrderDetails.status,
                            selectedOrderDetails.docstatus
                          ).className
                        }`}
                      >
                        {
                          getStatusBadge(
                            selectedOrderDetails.status,
                            selectedOrderDetails.docstatus
                          ).label
                        }
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 sm:col-span-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Payment
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      {getPaymentMethodLabel(
                        selectedOrderDetails.custom_payment_method,
                        selectedOrderDetails.custom_payment_status ||
                          selectedOrderDetails.status
                      )}
                    </p>
                  </div>
                </div>

                {/* Delivery Location */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Delivery Destination
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">
                        {selectedOrderAddress}
                      </p>
                      {selectedOrderDetails.custom_delivery_zone && (
                        <p className="mt-1 text-xs text-slate-500">
                          Zone: {selectedOrderDetails.custom_delivery_zone}
                        </p>
                      )}
                      {selectedOrderDetails.custom_customer_note && (
                        <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 italic">
                          Note: &ldquo;{selectedOrderDetails.custom_customer_note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Package size={16} className="text-red-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Items Ordered
                    </h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {selectedOrderDetails.items?.map((item, idx) => (
                      <div
                        key={item.name || `${item.item_code}-${idx}`}
                        className="flex items-center justify-between py-2.5 text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-50 text-xs font-bold text-red-600">
                            {item.qty}x
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {item.item_name || item.item_code}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatCurrency(item.rate)} each
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-800">
                          {formatCurrency(item.amount ?? item.qty * item.rate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <ReceiptText size={16} className="text-slate-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Payment Summary
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    {Number(selectedOrderDetails.base_net_total ?? selectedOrderDetails.net_total) > 0 && (
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span>
                          {formatCurrency(
                            Number(
                              selectedOrderDetails.base_net_total ??
                                selectedOrderDetails.net_total
                            )
                          )}
                        </span>
                      </div>
                    )}
                    {Number(selectedOrderDetails.custom_delivery_charge) > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>
                          {formatCurrency(
                            Number(selectedOrderDetails.custom_delivery_charge)
                          )}
                        </span>
                      </div>
                    )}
                    {Number(
                      selectedOrderDetails.base_total_taxes_and_charges ??
                        selectedOrderDetails.total_taxes_and_charges
                    ) > 0 && (
                      <div className="flex justify-between">
                        <span>VAT (5%)</span>
                        <span>
                          {formatCurrency(
                            Number(
                              selectedOrderDetails.base_total_taxes_and_charges ??
                                selectedOrderDetails.total_taxes_and_charges
                            )
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrderDetails.grand_total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
