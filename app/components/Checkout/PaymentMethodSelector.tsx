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
        console.log(`Successfully synced payment method (${method}) to order: ${salesOrderName}`);
      } catch (error) {
        console.error("Failed to update sales order payment method metadata:", error);
      }
    }
  };


  return (
    /* Changed grid-cols-1 to grid-cols-3 so it stays on one row, and adjusted gap sizes */
    <div className={`grid grid-cols-3 gap-2 sm:gap-4 w-full mt-4 ${isLoading ? "opacity-70 pointer-events-none" : ""}`}>

      {/* 1. Pay Online */}
      <button
        type="button"
        onClick={() => handleMethodChange("card_online")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 sm:p-5 ${currentMethod === "card_online"
          ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
          : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
          }`}
      >
        <CreditCard
          className={`mb-1.5 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${currentMethod === "card_online" ? "text-red-600" : "text-stone-400"
            }`}
        />
        <span className="text-[11px] font-semibold leading-tight sm:text-sm">Pay Online</span>
        <span className="text-[9px] leading-tight text-stone-400 mt-0.5 block w-full text-center break-words hidden min-[360px]:block">
          Card, Apple Pay
        </span>
      </button>

      {/* 2. Cash on Delivery */}
      <button
        type="button"
        onClick={() => handleMethodChange("cod")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 sm:p-5 ${currentMethod === "cod"
          ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
          : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
          }`}
      >
        <Banknote
          className={`mb-1.5 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${currentMethod === "cod" ? "text-red-600" : "text-stone-400"
            }`}
        />
        <span className="text-[11px] font-semibold leading-tight sm:text-sm">Cash on Delivery</span>
        <span className="text-[9px] leading-tight text-stone-400 mt-0.5 block w-full text-center break-words hidden min-[360px]:block">
          Cash at doorstep
        </span>
      </button>

      {/* 3. Card on Delivery */}
      <button
        type="button"
        onClick={() => handleMethodChange("card_on_delivery")}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 text-center transition-all outline-none focus:ring-2 focus:ring-red-500/20 sm:p-5 ${currentMethod === "card_on_delivery"
          ? "border-red-600 bg-red-50/30 text-stone-900 shadow-sm"
          : "border-stone-100 bg-white text-stone-500 hover:border-stone-200"
          }`}
      >
        <SmartphoneNfc
          className={`mb-1.5 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${currentMethod === "card_on_delivery" ? "text-red-600" : "text-stone-400"
            }`}
        />
        <span className="text-[11px] font-semibold leading-tight sm:text-sm">Card on Delivery</span>
        <span className="text-[9px] leading-tight text-stone-400 mt-0.5 block w-full text-center break-words hidden min-[360px]:block">
          Card reader machine
        </span>
      </button>
    </div>
  );
};

export default PaymentMethodSelector;

