"use client";

import React, { useState } from "react";
import PaymentMethodSelector, { PaymentMethodType } from "./PaymentMethodSelector";
import OriginalPaymentForm from "./PaymentForm"; // This leaves your current form completely intact
import { CardOnDeliverySection } from "./CardOnDeliverySection";
import type { SalesOrder } from "@/app/redux/apiType";
import CashOnDeliverySection from "./CashOnDeliverySection";

interface DoorstepPaymentWrapperProps {
    clientSecret: string;
    total: number;
    salesOrder: SalesOrder | null;
    onBack: () => void;
    onSuccess: () => void;
    onCodSubmit: (
        methodType: "cod" | "card_on_delivery",
        details?: { changeRequired?: string }
    ) => Promise<void>;
}

export const DoorstepPaymentWrapper: React.FC<DoorstepPaymentWrapperProps> = ({
    total,
    salesOrder,
    onCodSubmit,
}) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card_online");
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <div className="space-y-6">
            {/* Payment Selection Control */}
            <div className="space-y-2">
                <label className="text-sm font-medium tracking-wide text-stone-700">
                    Select Payment Method
                </label>
                <PaymentMethodSelector
                    onChange={(method) => setPaymentMethod(method)}
                    currentMethod={paymentMethod}
                    salesOrderName={salesOrder?.name}
                />
            </div>

            {/* Isolated View Switcher */}
            <div className="mt-6">
                {paymentMethod === "card_online" && (
                    // Mounts your original form without changes
                    <OriginalPaymentForm total={total} salesOrder={salesOrder} />
                )}

                {paymentMethod === "cod" && (
                    <CashOnDeliverySection
                        total={total}
                        currency="AED"
                        onConfirm={async (details) => {
                            // Convert detail choices into string format expected by pipeline
                            const changeString = details.changeRequested
                                ? `Bring change for ${details.payingWith}`
                                : "Exact Amount";

                            await onCodSubmit("cod", { changeRequired: changeString });
                        }}
                    />
                )}

                {paymentMethod === "card_on_delivery" && (
                    <div className="space-y-5">
                        <CardOnDeliverySection totalAmount={total} />
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={async () => {
                                try {
                                    setIsSubmitting(true);
                                    await onCodSubmit("card_on_delivery");
                                } catch (err) {
                                    console.error(err);
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            className="w-full rounded-2xl bg-red-600 py-4 text-sm font-medium  tracking-wide text-white shadow-xl shadow-red-600/10 transition-all hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {isSubmitting ? "Processing Order..." : "Confirm Card on Delivery Order"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoorstepPaymentWrapper;