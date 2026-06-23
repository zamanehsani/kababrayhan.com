"use client";

import React from "react";
import { CreditCard, Banknote, SmartphoneNfc } from "lucide-react";

export type PaymentMethodType = "card_online" | "cod" | "card_on_delivery";

interface PaymentMethodSelectorProps {
  currentMethod: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  currentMethod,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      
      {/* 1. Pay Online */}
      <button
        type="button"
        onClick={() => onChange("card_online")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 sm:p-5 ${
          currentMethod === "card_online"
            ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
            : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
        }`}
      >
        <CreditCard 
          size={22} 
          className={`mb-2 transition-colors ${
            currentMethod === "card_online" ? "text-red-600" : "text-stone-400"
          }`} 
        />
        <span className="text-sm font-semibold">Pay Online</span>
        <span className="text-[10px] text-stone-400 mt-0.5">
          Card, Apple & Google Pay
        </span>
      </button>

      {/* 2. Cash on Delivery */}
      <button
        type="button"
        onClick={() => onChange("cod")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 sm:p-5 ${
          currentMethod === "cod"
            ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
            : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
        }`}
      >
        <Banknote 
          size={22} 
          className={`mb-2 transition-colors ${
            currentMethod === "cod" ? "text-red-600" : "text-stone-400"
          }`} 
        />
        <span className="text-sm font-semibold">Cash on Delivery</span>
        <span className="text-[10px] text-stone-400 mt-0.5">
          Pay with cash at doorstep
        </span>
      </button>

      {/* 3. Card on Delivery */}
      <button
        type="button"
        onClick={() => onChange("card_on_delivery")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 sm:p-5 ${
          currentMethod === "card_on_delivery"
            ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
            : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
        }`}
      >
        <SmartphoneNfc 
          size={22} 
          className={`mb-2 transition-colors ${
            currentMethod === "card_on_delivery" ? "text-red-600" : "text-stone-400"
          }`} 
        />
        <span className="text-sm font-semibold">Card on Delivery</span>
        <span className="text-[10px] text-stone-400 mt-0.5">
          Pay via card reader machine
        </span>
      </button>
    </div>
  );
};

export default PaymentMethodSelector;