"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import type { SalesOrder } from "@/app/redux/apiType";
import DirhamIcon from "../icon/DirhamIcon";

const PaymentForm = ({
  total,
  salesOrder,
}: {
  total: number;
  salesOrder: SalesOrder | null;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const salesOrderName = salesOrder?.name?.trim();
    if (!salesOrderName) {
      setPaymentError(
        "Sales order is missing. Payment cannot continue without order tracking metadata."
      );
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setPaymentError(error.message ?? "Payment failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        router.push("/thank-you");
      }
    } catch {
      setPaymentError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-200">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {paymentError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {paymentError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
          !stripe || !elements || isProcessing
            ? "cursor-not-allowed bg-stone-400 text-white"
            : "bg-red-600 text-white shadow-red-200 hover:bg-red-700 active:scale-95"
        }`}
      >
        {isProcessing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <span className="flex items-center justify-center gap-0.5 normal-case">
            <span className="uppercase tracking-[0.2em] mr-1">Pay</span>
            <DirhamIcon size={14} className="text-white" />
            {total.toFixed(2)}
          </span>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-medium">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Secured by Stripe • AES-256 Encryption</span>
      </div>
    </form>
  );
};

export default PaymentForm;
