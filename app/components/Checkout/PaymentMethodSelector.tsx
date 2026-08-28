"use client";

import React from "react";
import { CreditCard, Banknote, SmartphoneNfc } from "lucide-react";
export type PaymentMethodType = "card_online" | "cod" | "card_on_delivery";
import { useUpdateSalesOrderMutation } from "../../redux/api";

interface PaymentMethodSelectorProps {
  currentMethod: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  salesOrderName: string | undefined;

}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  currentMethod,
  onChange,
  salesOrderName,
}) => {

  const [updateSalesOrder, { isLoading }] = useUpdateSalesOrderMutation();

  const handleMethodChange = async (method: PaymentMethodType) => {
    // 1. Instantly change the local UI state for an instantaneous, responsive feeling
    onChange(method);

    // 2. If we have a valid sales order identifier, sync it directly with Frappe database
    if (salesOrderName) {
      try {
        await updateSalesOrder({
          salesOrderName: salesOrderName.trim(),
          custom_payment_method: method,
          // If switching to card_online, initial state is "Unpaid" until Stripe resolves it
          custom_payment_status: "Unpaid",
        }).unwrap();
      } catch (error) {
        console.error("Failed to update sales order payment method metadata:", error);
      }
    }
  };


  return (
    <div className={`mt-3 grid w-full grid-cols-3 gap-1.5 sm:gap-2 ${isLoading ? "pointer-events-none opacity-70" : ""}`}>
      <button
        type="button"
        onClick={() => handleMethodChange("card_online")}
        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 ${currentMethod === "card_online"
          ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
          : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
          }`}
      >
        <CreditCard
          className={`mb-1 h-4 w-4 transition-colors ${currentMethod === "card_online" ? "text-red-600" : "text-stone-400"}`}
        />
        <span className="text-[10px] font-semibold leading-tight sm:text-xs">Pay Online</span>
      </button>

      <button
        type="button"
        onClick={() => handleMethodChange("cod")}
        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 ${currentMethod === "cod"
          ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
          : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
          }`}
      >
        <Banknote
          className={`mb-1 h-4 w-4 transition-colors ${currentMethod === "cod" ? "text-red-600" : "text-stone-400"}`}
        />
        <span className="text-[10px] font-semibold leading-tight sm:text-xs">Cash on Delivery</span>
      </button>

      <button
        type="button"
        onClick={() => handleMethodChange("card_on_delivery")}
        className={`flex flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 ${currentMethod === "card_on_delivery"
          ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
          : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
          }`}
      >
        <SmartphoneNfc
          className={`mb-1 h-4 w-4 transition-colors ${currentMethod === "card_on_delivery" ? "text-red-600" : "text-stone-400"}`}
        />
        <span className="text-[10px] font-semibold leading-tight sm:text-xs">Card on Delivery</span>
      </button>
    </div>
  );
};

export default PaymentMethodSelector;

