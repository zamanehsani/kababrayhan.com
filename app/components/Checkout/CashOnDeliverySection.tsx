"use client";

import React, { useState, useMemo } from "react";

interface CodDetails {
  changeRequested: boolean;
  payingWith: number;
  changeNeeded: number;
}

interface CashOnDeliverySectionProps {
  total: number;
  currency?: string;
  // Updated onConfirm signature to pass along logistics data to the ERP/sales order pipeline
  onConfirm: (details: CodDetails) => Promise<void> | void;
}

const CashOnDeliverySection: React.FC<CashOnDeliverySectionProps> = ({
  total = 0,
  currency = "AED",
  onConfirm,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection state: "exact" | "50" | "100" | "200" | "500" | "custom"
  const [changeMode, setChangeMode] = useState<string>("exact");
  const [customAmount, setCustomAmount] = useState<string>("");

  // Determine standard bank note options that are logical based on the bill total
  const standardNotes = useMemo(() => {
    const notes = [50, 100, 200, 500];
    return notes.filter((note) => note > total);
  }, [total]);

  // Compute exact financial metrics dynamically
  const details = useMemo<CodDetails>(() => {
    if (changeMode === "exact") {
      return { changeRequested: false, payingWith: total, changeNeeded: 0 };
    }

    let payingAmount = total;
    if (changeMode === "custom") {
      const parsed = parseFloat(customAmount);
      payingAmount = !isNaN(parsed) && parsed > total ? parsed : total;
    } else {
      payingAmount = parseFloat(changeMode) || total;
    }

    const changeNeeded = payingAmount - total;
    return {
      changeRequested: changeNeeded > 0,
      payingWith: payingAmount,
      changeNeeded: changeNeeded > 0 ? changeNeeded : 0,
    };
  }, [changeMode, customAmount, total]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Safety check for custom inputs
    if (changeMode === "custom") {
      const parsed = parseFloat(customAmount);
      if (isNaN(parsed) || parsed <= total) {
        alert(`Please enter a valid amount greater than ${total.toFixed(2)} ${currency}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onConfirm(details);
    } catch (error) {
      console.error("COD submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Step Label */}
      <div className="space-y-1">
        <label className="text-[14px] font-bold tracking-wider text-stone-400">
          How will you pay the driver?
        </label>
        <p className="text-xs text-stone-500">
          Select an option so our courier can bring the exact change line item.
        </p>
      </div>

      {/* Options Grid Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Exact Cash Selection */}
        <button
          type="button"
          onClick={() => setChangeMode("exact")}
          className={`flex flex-col items-start justify-between rounded-xl border-2 p-3 text-left transition-all ${changeMode === "exact"
              ? "border-red-600 bg-red-50/20 text-stone-900"
              : "border-stone-100 bg-white text-stone-600 hover:border-stone-200"
            }`}
        >
          <span className="text-sm font-bold">Exact Amount</span>
          <span className="text-[10px] opacity-70 mt-1">No change needed</span>
        </button>

        {/* Dynamic Bank Note Suggestions */}
        {standardNotes.map((note) => (
          <button
            type="button"
            key={note}
            onClick={() => setChangeMode(note.toString())}
            className={`flex flex-col items-start justify-between rounded-xl border-2 p-3 text-left transition-all ${changeMode === note.toString()
                ? "border-red-600 bg-red-50/20 text-stone-900"
                : "border-stone-100 bg-white text-stone-600 hover:border-stone-200"
              }`}
          >
            <span className="text-sm font-bold">{note} {currency}</span>
            <span className="text-[10px] opacity-70 mt-1">Pay with bill</span>
          </button>
        ))}

        {/* Custom Input Tab Trigger */}
        <button
          type="button"
          onClick={() => setChangeMode("custom")}
          className={`flex flex-col items-start justify-between rounded-xl border-2 p-3 text-left transition-all ${changeMode === "custom"
              ? "border-red-600 bg-red-50/20 text-stone-900"
              : "border-stone-100 bg-white text-stone-600 hover:border-stone-200"
            }`}
        >
          <span className="text-sm font-bold">Other Note</span>
          <span className="text-[10px] opacity-70 mt-1">Specify cash size</span>
        </button>
      </div>

      {/* Custom Amount Form Element */}
      {changeMode === "custom" && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            Enter the amount you will hand to the courier
          </label>
          <div className="relative rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-inner">
            <input
              type="number"
              inputMode="decimal"
              placeholder={`e.g., ${(Math.ceil(total / 50) * 50).toString()}`}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-stone-900 placeholder-stone-300 outline-none pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
              {currency}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Summary Notice */}
      {details.changeRequested && details.changeNeeded > 0 && (
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-4 flex justify-between items-center text-xs animate-in fade-in duration-300">
          <div>
            <p className="text-stone-500 font-medium">Driver will bring back:</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              Handing {details.payingWith.toFixed(2)} - Order {total.toFixed(2)}
            </p>
          </div>
          <p className="text-base font-black text-stone-900">
            {details.changeNeeded.toFixed(2)} <span className="text-xs font-bold">{currency}</span>
          </p>
        </div>
      )}

      {/* Warning Box */}
      <div className="rounded-2xl bg-amber-50/40 border border-amber-100 p-4 text-xs text-amber-800 leading-relaxed">
        💡 <strong>Note:</strong> Cash on delivery fulfillment is completed at your doorstep. Please keep your specified currency ready for delivery agents.
      </div>

      {/* Primary Call to Action */}
      <button
        type="button"
        disabled={isSubmitting || (changeMode === "custom" && (!customAmount || parseFloat(customAmount) <= total))}
        onClick={handleSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-xs font-black tracking-[0.2em] text-white shadow-xl transition-all hover:bg-stone-800 active:scale-95 disabled:bg-stone-300 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-white" />
        ) : (
          `Confirm & Place COD Order (${total.toFixed(2)} ${currency})`
        )}
      </button>
    </div>
  );
};

export default CashOnDeliverySection;