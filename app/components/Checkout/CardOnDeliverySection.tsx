"use client";

import React from "react";
import { SmartphoneNfc, ShieldCheck } from "lucide-react";
import DirhamIcon from "../icon/DirhamIcon";

interface CardOnDeliverySectionProps {
  totalAmount: number;
}

export const CardOnDeliverySection: React.FC<CardOnDeliverySectionProps> = ({
  totalAmount,
}) => {
  return (
    <div className="mt-4 space-y-4 animate-fade-in">
      <div className=" p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <SmartphoneNfc size={20} />
          </div>
          <div>
            <h4 className="text-sm font-medium tracking-wide text-stone-800">
              Pay via Card Reader
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              You can pay using your debit/credit card or any wallets.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 ">
        <span className="text-xs font-semibold tracking-wider text-stone-400">
          Amount Due
        </span>
        <span className="flex items-center gap-1 text-base font-bold tracking-tight">
          <DirhamIcon size={14} className="text-white" />
          {totalAmount.toFixed(2)}
        </span>
      </div>
    </div>
  );
};