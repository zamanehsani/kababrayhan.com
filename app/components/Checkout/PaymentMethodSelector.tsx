"use client";

import React from "react";

export type PaymentMethodType = "card_online" | "cod";

interface PaymentMethodSelectorProps {
  currentMethod: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  currentMethod,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange("card_online")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all outline-none focus:ring-2 focus:ring-red-500/20 ${
          currentMethod === "card_online"
            ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
            : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
        }`}
      >
        <span className="text-xl mb-1">💳</span>
        <span className="text-sm font-semibold">Pay Online</span>
        <span className="text-[10px] text-stone-400 mt-0.5">
          Card, Apple & Google Pay
        </span>
      </button>

      <button
        type="button"
        onClick={() => onChange("cod")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-5 transition-all outline-none focus:ring-2 focus:ring-red-500/20 ${
          currentMethod === "cod"
            ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
            : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
        }`}
      >
        <span className="text-xl mb-1">💵</span>
        <span className="text-sm font-semibold">Cash on Delivery</span>
        <span className="text-[10px] text-stone-400 mt-0.5">
          Pay at your doorstep
        </span>
      </button>
    </div>
  );
};

export default PaymentMethodSelector;