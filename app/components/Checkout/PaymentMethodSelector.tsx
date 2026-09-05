"use client";

import React from "react";
import { Banknote, CreditCard, SmartphoneNfc } from "lucide-react";

import type { PaymentMethodType, PaymentOption } from "@/app/lib/paymentMethods";

export type { PaymentMethodType };

interface PaymentMethodSelectorProps {
  options: PaymentOption[];
  currentMethod: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  isLoading?: boolean;
  isSyncing?: boolean;
}

const ICONS: Record<PaymentMethodType, React.ElementType> = {
  cod: Banknote,
  card_on_delivery: SmartphoneNfc,
  card_online: CreditCard,
};

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  options,
  currentMethod,
  onChange,
  isLoading = false,
  isSyncing = false,
}) => {
  if (isLoading) {
    return (
      <div className="mt-3 grid w-full grid-cols-3 gap-1.5 sm:gap-2">
        {["a", "b", "c"].map((key) => (
          <div
            key={key}
            className="h-16 animate-pulse rounded-xl border-2 border-stone-100 bg-stone-50"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`mt-3 grid w-full gap-1.5 sm:gap-2 ${
        options.length === 2 ? "grid-cols-2" : "grid-cols-3"
      } ${isSyncing ? "pointer-events-none opacity-70" : ""}`}
    >
      {options.map((option) => {
        const Icon = ICONS[option.id];
        const isActive = currentMethod === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 ${
              isActive
                ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
                : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
            }`}
          >
            <Icon
              className={`mb-1 h-4 w-4 transition-colors ${
                isActive ? "text-red-600" : "text-stone-400"
              }`}
            />
            <span className="text-[10px] font-semibold leading-tight sm:text-xs">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodSelector;
