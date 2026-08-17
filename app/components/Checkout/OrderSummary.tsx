import React from "react";
import Image from "next/image";
import DirhamIcon from "../icon/DirhamIcon";

interface CartEntry {
  item: {
    id: string;
    title: string;
    baseTitle?: string;
    variationTitle?: string;
    image: string;
    discountedPrice: number;
  };
  qty: number;
  addon?: {
    title: string;
  };
}

interface OrderSummaryProps {
  cart: CartEntry[];
  total: number;
  deliveryCharge?: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, total, deliveryCharge = 0 }) => {
  const grandTotal = total + deliveryCharge;
  // Calculate the 5% VAT amount that is already included in the items subtotal
  const vatIncludedAmount = total - total / 1.05;

  return (
    <section className="bg-white px-2 py-6 transition-all">
      {/* Header with Red Accent */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-red-600" />
          <h2 className="text-xl font-medium tracking-wide text-stone-900">
            Your Order
          </h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-[13px] font-medium uppercase tracking-wider text-stone-500">
          {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      {/* Item List */}
      <div className="space-y-5">
        {cart.map((entry, idx) => (
          <div
            key={entry.item?.id ? `${entry.item.id}-${idx}` : idx}
            className="group flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-stone-50 bg-stone-50">
                <Image
                  src={entry.item?.image || "/"}
                  alt={entry.item?.title || ""}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="min-w-0">
                <div className="text-base font-medium leading-tight text-stone-900">
                  <span className="text-red-600">{entry.qty || 1}x</span>{" "}
                  <span>{entry.item?.baseTitle || entry.item?.title}</span>
                </div>

                {entry.item?.variationTitle && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] font-medium tracking-wide text-stone-600">
                    <span className="rounded-full bg-red-50 px-2 py-1 text-red-600">
                      {entry.item.variationTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-end gap-0.5 text-base font-medium text-stone-900">
                <DirhamIcon className="text-stone-900" />
                {((entry.item?.discountedPrice || 0) * (entry.qty || 1)).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="mt-8 space-y-3 border-t border-stone-100 pt-6">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-stone-500">Subtotal</span>
          <span className="flex items-center gap-0.5 font-bold text-stone-900">
            <DirhamIcon size={12} className="text-stone-900" />
            {total.toFixed(2)}
          </span>
        </div>

        {/* Delivery Fee */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-stone-500">Delivery Fee</span>
          {deliveryCharge > 0 ? (
            <span className="flex items-center gap-0.5 font-bold text-stone-900">
              <DirhamIcon size={11} className="text-stone-900" />
              {deliveryCharge.toFixed(2)}
            </span>
          ) : (
            <span className="font-bold text-red-600 uppercase text-[10px] tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
              Free
            </span>
          )}
        </div>

        {/* Best Practice: Explicit VAT Breakdown Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-stone-500">VAT</span>
            <span className="rounded bg-stone-100 px-1 py-0.5 text-[10px] font-semibold text-stone-600">
              5% Inc.
            </span>
          </div>
          <span className="flex items-center gap-0.5 font-medium text-stone-600">
            <DirhamIcon size={11} className="text-stone-500" />
            {vatIncludedAmount.toFixed(2)}
          </span>
        </div>
        
        {/* Total Highlight */}
        <div className="mt-6 flex items-center justify-between rounded-full p-4 bg-red-50 border border-red-600">
          <span className=" font-medium tracking-widest text-red-600">
            Total
          </span>
          <div className="text-right">
            <span className="flex items-center gap-0.5 text-xl font-medium leading-none text-red-600">
              <DirhamIcon size={16} className="text-red-600 md:w-[18px] md:h-[18px]" />
              {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSummary;