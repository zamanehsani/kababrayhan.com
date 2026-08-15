"use client";

import React from "react";
import { createPortal } from "react-dom";

export type DeliveryOption = "delivery" | "takeaway";

export type DeliveryTakeawayModalProps = {
  open: boolean;
  onSelect: (option: DeliveryOption) => void;
  onClose: () => void;
};

const DeliveryTakeawayModal: React.FC<DeliveryTakeawayModalProps> = ({ open, onSelect, onClose }) => {
  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-black"
          aria-label="Close delivery/takeaway modal"
        >
          ×
        </button>
        <h2 className="text-xl font-normal mb-6 text-center tracking-wide">Choose Order Type</h2>
        <div className="flex flex-col gap-4">
          <button
            className="w-full rounded-xl bg-red-600 py-3 text-base font-medium  tracking-widest text-white transition-all hover:bg-red-700 active:scale-[0.98]"
            onClick={() => onSelect("delivery")}
          >
            Delivery (Specify Address)
          </button>
          <button
            className="w-full rounded-xl bg-gray-100 py-3 text-base font-medium  tracking-widest text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.98]"
            onClick={() => onSelect("takeaway")}
          >
            Take Away
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeliveryTakeawayModal;
