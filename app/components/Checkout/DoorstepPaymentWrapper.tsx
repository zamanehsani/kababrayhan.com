"use client";

import React, { useState } from "react";
import PaymentMethodSelector, { PaymentMethodType } from "./PaymentMethodSelector";
import OriginalPaymentForm from "./PaymentForm"; // This leaves your current form completely intact
import { CardOnDeliverySection } from "./CardOnDeliverySection";
import { ShoppingBag, ArrowLeft } from "lucide-react";
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
    clientSecret,
    total,
    salesOrder,
    onBack,
    onSuccess,
    onCodSubmit,
}) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("card_online");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Doorstep-specific states
    const [cashChangeOption, setCashChangeOption] = useState<string>("exact");
    const [customChangeAmount, setCustomChangeAmount] = useState<string>("");

    const handleDoorstepOrderSubmit = async () => {
        try {
            setIsSubmitting(true);

            let changeDetail = "Exact amount";
            if (paymentMethod === "cod") {
                if (cashChangeOption === "100") changeDetail = "Need change for 100 AED";
                else if (cashChangeOption === "200") changeDetail = "Need change for 200 AED";
                else if (cashChangeOption === "custom") changeDetail = `Need change for ${customChangeAmount} AED`;
            }

            // Hand off the payload directly to the orchestration tier for ERPNext
            await onCodSubmit(paymentMethod as "cod" | "card_on_delivery", {
                changeRequired: paymentMethod === "cod" ? changeDetail : undefined,
            });

            onSuccess();
        } catch (error) {
            console.error("Doorstep processing error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Payment Selection Control */}
            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Select Payment Method
                </label>
                <PaymentMethodSelector
                    currentMethod={paymentMethod}
                    onChange={(method) => setPaymentMethod(method)}
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
                            className="w-full rounded-2xl bg-red-600 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-red-600/10 transition-all hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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