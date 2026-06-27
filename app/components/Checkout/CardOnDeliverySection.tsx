"use client";

import React from "react";
import { SmartphoneNfc, ShieldCheck } from "lucide-react";

interface CardOnDeliverySectionProps {
  totalAmount: number;
}

export const CardOnDeliverySection: React.FC<CardOnDeliverySectionProps> = ({
  totalAmount,
}) => {
  return (
    <div className="mt-4 space-y-4 animate-fade-in">
      <div className="rounded-2xl border border-stone-100 bg-stone-50/50 p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <SmartphoneNfc size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              Pay at Doorstep via Card Reader
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              Our delivery driver will bring a secure, wireless payment terminal to your door. You can pay using your debit/credit card or mobile wallets like Apple Pay & Google Pay.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-stone-100/80 pt-3 text-[11px] font-medium text-emerald-600">
          <ShieldCheck size={14} />
          <span>Secure contactless transaction encrypted at the terminal</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-stone-900 p-4 text-white">
        <span className="text-xs font-semibold tracking-wider text-stone-400">
          Amount Due at Door
        </span>
        <span className="text-base font-bold tracking-tight">
          {totalAmount.toFixed(2)} AED
        </span>
      </div>
    </div>
  );
};