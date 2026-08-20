import { CalendarDays, Package, ReceiptText } from "lucide-react";
import type { SalesOrderSummary } from "@/app/redux/apiType";

type OrdersTabProps = {
  orders: SalesOrderSummary[];
  formatCurrency: (amount: number) => string;
  onSelectOrder: (orderName: string) => void;
};

export default function OrdersTab({
  orders,
  formatCurrency,
  onSelectOrder,
}: OrdersTabProps) {
  return (
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
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No orders have been placed yet.
          </div>
        ) : (
          orders.map((order) => (
            <button
              key={order.name}
              type="button"
              onClick={() => onSelectOrder(order.name)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-red-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Order name
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{order.name}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(order.grand_total)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  {new Date(order.transaction_date).toLocaleDateString("en-AE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-red-600">
                  View details
                  <ReceiptText size={12} />
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
