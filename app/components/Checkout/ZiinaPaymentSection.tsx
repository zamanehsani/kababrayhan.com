"use client";

import { useState } from "react";
import { useInitializeZiinaPaymentMutation } from "@/app/redux/api";

type ZiinaPaymentSectionProps = {
  total: number;
  salesOrderName?: string | null;
  isDisabled?: boolean;
};

const ZiinaPaymentSection = ({
  total,
  salesOrderName,
  isDisabled = false,
}: ZiinaPaymentSectionProps) => {
  const [initializeZiinaPayment, { isLoading }] =
    useInitializeZiinaPaymentMutation();
  const [ziinaError, setZiinaError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const canStartPayment =
    !isDisabled && !isLoading && Boolean(salesOrderName) && total > 0;

  const handleZiinaCheckout = async () => {
    const orderId = salesOrderName?.trim();

    if (!orderId) {
      setZiinaError("Sales order is required before starting Ziina payment.");
      return;
    }

    setZiinaError(null);

    try {
      const response = await initializeZiinaPayment({
        order_id: orderId,
        amount: total,
      }).unwrap();

      const nextRedirectUrl = response?.message?.redirect_url;

      if (!nextRedirectUrl) {
        setZiinaError("Ziina did not return a redirect URL.");
        return;
      }

      setRedirectUrl(nextRedirectUrl);
      globalThis.open(nextRedirectUrl, "_blank", "noopener,noreferrer");
    } catch (error: unknown) {
      const fallbackMessage = "Ziina payment initialization failed.";

      if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof (error as { data?: unknown }).data === "object" &&
        (error as { data?: { message?: unknown } }).data?.message
      ) {
        setZiinaError(
          String((error as { data?: { message?: unknown } }).data?.message)
        );
        return;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        typeof (error as { error?: unknown }).error === "string"
      ) {
        setZiinaError((error as { error: string }).error);
        return;
      }

      setZiinaError(fallbackMessage);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Test Ziina checkout flow while keeping Stripe active.
      </p>

      <button
        type="button"
        onClick={handleZiinaCheckout}
        disabled={!canStartPayment}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
          canStartPayment
            ? "bg-stone-900 text-white hover:bg-stone-700 active:scale-95"
            : "cursor-not-allowed bg-stone-300 text-stone-500"
        }`}
      >
        {isLoading ? "Opening Ziina..." : `Pay AED ${total.toFixed(2)} with Ziina`}
      </button>

      {!salesOrderName && (
        <p className="text-xs font-semibold text-amber-700">
          Create a sales order first to enable Ziina testing.
        </p>
      )}

      {ziinaError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-brand-700">
          {ziinaError}
        </div>
      )}

      {redirectUrl && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Ziina URL generated. If a new tab did not open, continue from this link:
          <a
            href={redirectUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-semibold underline"
          >
            Open Ziina checkout
          </a>
        </div>
      )}
    </div>
  );
};

export default ZiinaPaymentSection;