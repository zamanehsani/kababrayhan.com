"use client";

import { useState } from "react";
import { CalendarDays, CreditCard, MapPin, Package, ReceiptText, X } from "lucide-react";
import type { SalesOrderDetails, SalesOrderSummary } from "@/app/redux/apiType";
import { useGetSalesOrderQuery } from "@/app/redux/api";

type OrdersTabProps = {
  orders: SalesOrderSummary[];
  formatCurrency: (amount: number) => string;
};

export default function OrdersTab({ orders, formatCurrency }: OrdersTabProps) {
  const [selectedOrderName, setSelectedOrderName] = useState<string | null>(null);
  const { data: selectedOrderDetails } = useGetSalesOrderQuery(selectedOrderName || "", { skip: !selectedOrderName });
  const selectedOrderAddress = (selectedOrderDetails as SalesOrderDetails & { customer_address?: string } | undefined)?.customer_address || "Address not available";

  
  return (
    <>
      <div className="py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Package size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Orders</p>
              <p className="text-xs text-slate-500">Recent purchases and order history</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {orders.length === 0 ? 
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No orders have been placed yet.</div>
          : orders.map((order) => 
          <button key={order.name} type="button" 
            onClick={() => setSelectedOrderName(order.name)} 
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-red-200 hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Order name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{order.name}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(order.grand_total)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} />{new Date(order.transaction_date).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-red-600">View details<ReceiptText size={12} /></span>
              </div>
            </button>
          )}
        </div>
      </div>

      {selectedOrderName && selectedOrderDetails && 
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-5">
            <div>
              <p className="text-sm font-semibold uppercase text-red-600">Order details</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedOrderDetails.name}</h3>
            </div>
            <button type="button" onClick={() => setSelectedOrderName(null)} 
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:text-red-600" aria-label="Close order details">
                <X size={16} />
            </button>
          </div>
          <div className="space-y-6 p-5">
            
            <div className="grid gap-3 grid-cols-3">
              <div className="rounded-xl border border-slate-200 py-2 px-4">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Date</p>
                <p className="font-medium text-slate-700">
                  {new Date(selectedOrderDetails.transaction_date).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 py-2 px-4">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Status</p>
                <p className=" font-medium text-slate-700">{selectedOrderDetails.status}</p>
              </div>
              <div className="rounded-xl border border-slate-200 py-2 px-4">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Total</p>
                <p className="font-medium text-slate-700">
                  {formatCurrency(selectedOrderDetails.grand_total)}</p>
              </div>
            </div>

            <div className="px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Delivery address</p>
                  <p className="mt-1 text-sm text-slate-700">{selectedOrderAddress}</p>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Package size={18} />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Order items</h4>
              </div>
              <div className="space-y-3">{selectedOrderDetails.items?.map((item) => 
                <div key={`${selectedOrderDetails.name}-${item.name}-${item.item_code}`} 
                  className="flex items-center justify-between gap-4  bg-white p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.qty}<span className="text-red-600">x</span> { item.item_code || item.name}</p>
                    {/* <p className="mt-1 text-xs text-slate-500">Qty: </p> */}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(item.amount ?? item.qty * item.rate)}</p>
                </div>
                )}
              </div>
            </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <ReceiptText size={18} />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Pricing</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Net Total</span>
                  <span>{selectedOrderDetails.base_net_total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxes & Charges</span>
                  <span>{selectedOrderDetails.base_total_taxes_and_charges}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Grand total</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(selectedOrderDetails.grand_total)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <CreditCard size={18} />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Payment</h4>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Method</span>
                  <span className="font-medium text-slate-800">{selectedOrderDetails.status === "Paid" ? "Card / COD" : "Awaiting payment"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Order status</span>
                  <span className="font-medium text-slate-800">{selectedOrderDetails.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    }
    </>
  );
}
