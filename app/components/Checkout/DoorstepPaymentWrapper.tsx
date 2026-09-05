"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

import PaymentMethodSelector from "./PaymentMethodSelector";
import OnlinePaymentSection from "./OnlinePaymentSection";
import { CardOnDeliverySection } from "./CardOnDeliverySection";
import CashOnDeliverySection from "./CashOnDeliverySection";
import type { PaymentMethodType, PaymentOption } from "@/app/lib/paymentMethods";

interface DoorstepPaymentWrapperProps {
  total: number;
  options: PaymentOption[];
  isLoadingOptions: boolean;
  paymentMethod: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  isSubmitting: boolean;
  isOnlineReady: boolean;
  clientSecret: string;
  onCodSubmit: (
    methodType: "cod" | "card_on_delivery",
    details?: { changeRequired?: string }
  ) => Promise<void>;
  onCreateDraftOrder: () => Promise<string>;
  onSubmitPaidOrder: (invoiceName: string) => Promise<void>;
}

export const DoorstepPaymentWrapper: React.FC<DoorstepPaymentWrapperProps> = ({
  total,
  options,
  isLoadingOptions,
  paymentMethod,
  onMethodChange,
  isSubmitting,
  isOnlineReady,
  clientSecret,
  onCodSubmit,
  onCreateDraftOrder,
  onSubmitPaidOrder,
}) => {
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);
  const isBusy = isSubmitting || isLocalSubmitting;

  return (
    <div className="space-y-6">
      <PaymentMethodSelector
        options={options}
        currentMethod={paymentMethod}
        onChange={onMethodChange}
        isLoading={isLoadingOptions}
        isSyncing={isBusy}
      />

      <div className="mt-6">
        {paymentMethod === "card_online" &&
          (isOnlineReady ? (
            <OnlinePaymentSection
              total={total}
              clientSecret={clientSecret}
              isSubmitting={isBusy}
              onCreateDraftOrder={onCreateDraftOrder}
              onSubmitPaidOrder={onSubmitPaidOrder}
            />
          ) : (
            <div className="flex flex-col items-center py-8 text-stone-400">
              <Loader2 size={20} className="mb-2 animate-spin text-red-600" />
              <p className="text-[10px] font-bold tracking-widest uppercase">
                Securing payment line...
              </p>
            </div>
          ))}

        {paymentMethod === "cod" && (
          <CashOnDeliverySection
            total={total}
            currency="AED"
            onConfirm={async (details) => {
              const changeString = details.changeRequested
                ? `Bring change for ${details.payingWith}`
                : "Exact Amount";

              try {
                setIsLocalSubmitting(true);
                await onCodSubmit("cod", { changeRequired: changeString });
              } finally {
                setIsLocalSubmitting(false);
              }
            }}
          />
        )}

        {paymentMethod === "card_on_delivery" && (
          <div className="space-y-5">
            <CardOnDeliverySection totalAmount={total} />
            <button
              type="button"
              disabled={isBusy}
              onClick={async () => {
                try {
                  setIsLocalSubmitting(true);
                  await onCodSubmit("card_on_delivery");
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsLocalSubmitting(false);
                }
              }}
              className="w-full rounded-full bg-red-600 py-4 text-sm font-medium tracking-wide text-white transition-all hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isBusy
                ? "Processing Order..."
                : "Confirm Card on Delivery Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoorstepPaymentWrapper;
