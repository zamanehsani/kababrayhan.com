"use client";

import React, { useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

import DirhamIcon from "../icon/DirhamIcon";

const BILLING_DETAILS = {
  address: {
    country: "AE",
    state: "AJ",
    city: "Ajman",
    line1: "Ajman",
    postal_code: "00000",
  },
} as const;

interface OnlinePaymentSectionProps {
  total: number;
  isSubmitting?: boolean;
  onConfirmPayment: () => Promise<void>;
}

/** Stripe wallets (Apple Pay / Google Pay / Link) plus the card form. */
const OnlinePaymentSection: React.FC<OnlinePaymentSectionProps> = ({
  total,
  isSubmitting = false,
  onConfirmPayment,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [hasWallets, setHasWallets] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;

    console.log("[Stripe Payment] Starting payment confirmation...");
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${globalThis.location.origin}/thank-you`,
          payment_method_data: { billing_details: BILLING_DETAILS },
        },
      });

      if (error) {
        console.error("[Stripe Payment] Confirmation error:", error);
        setPaymentError(error.message ?? "Payment failed. Please try again.");
        return;
      }

      console.log("[Stripe Payment] PaymentIntent status:", paymentIntent?.status, paymentIntent);

      if (paymentIntent?.status === "succeeded") {
        console.log("[Stripe Payment] Succeeded. Submitting order to Frappe...");
        await onConfirmPayment();
      }
    } catch (confirmError) {
      console.error("[Stripe Payment] Exception during confirmation:", confirmError);
      setPaymentError(
        confirmError instanceof Error
          ? confirmError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isBusy = isProcessing || isSubmitting;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={hasWallets ? "block" : "hidden"}>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 48,
            layout: { maxColumns: 2, maxRows: 2 },
          }}
          onReady={(event) => {
            setHasWallets(Boolean(event.availablePaymentMethods));
          }}
          onConfirm={confirm}
        />
        <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          or pay by card
          <span className="h-px flex-1 bg-stone-200" />
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void confirm();
        }}
        className="space-y-5"
      >
        <div className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
          <PaymentElement
            onChange={() => setPaymentError(null)}
            options={{
              layout: "tabs",
              wallets: { applePay: "never", googlePay: "never" },
              fields: {
                billingDetails: {
                  address: {
                    country: "never",
                    state: "never",
                    city: "never",
                    line1: "never",
                    line2: "never",
                    postalCode: "never",
                  },
                },
              },
              defaultValues: { billingDetails: BILLING_DETAILS },
            }}
          />
        </div>

        {paymentError && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {paymentError}
          </p>
        )}

        <button
          type="submit"
          disabled={!stripe || isBusy}
          className="flex h-13 w-full items-center justify-center gap-1.5 rounded-full bg-red-600 text-sm font-semibold tracking-wide text-white transition-all hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? (
            "Processing Order..."
          ) : (
            <>
              Pay
              <DirhamIcon size={12} className="text-white" />
              {total.toFixed(2)}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default OnlinePaymentSection;
