"use client";

import { MapPin, Plus, Check, X } from "lucide-react";
import type { DeliveryAddressItem } from "@/app/lib/customerPortal";

type SavedAddressesModalProps = {
  open: boolean;
  title?: string;
  description?: string;

  addresses: DeliveryAddressItem[];
  selectedAddressId?: string;

  onSelect: (address: DeliveryAddressItem) => void;
  onAddNew: () => void;
  onClose: () => void;
  onContinue: () => void;
};

export default function SavedAddressesModal({
  open,
  title = "Saved addresses",
  description = "Choose where you want your order delivered.",
  addresses,
  selectedAddressId,
  onSelect,
  onAddNew,
  onClose,
  onContinue,
}: Readonly<SavedAddressesModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 md:p-6 animate-fade-in">
      {/* Main Container: 
        - Full screen dimensions (`w-full h-full`) on mobile to handle device toolbars.
        - Structured layout constraints (`max-w-xl sm:h-auto sm:max-h-[85vh] sm:rounded-3xl`) on wider screens.
      */}
      <div className="relative flex flex-col w-full h-full bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)] overflow-hidden sm:h-auto sm:max-h-[85vh] sm:max-w-xl sm:rounded-3xl sm:border sm:border-slate-100">

        {/* Header Section */}
        <div className="relative flex items-start gap-4 border-b border-slate-100 bg-white px-5 pb-5 pt-6 shrink-0 sm:px-8 sm:pt-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50">
            <MapPin size={22} className="text-red-500" />
          </div>

          <div className="flex-1 pr-8">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {description}
            </p>
          </div>

          {/* Close Action Control */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all hover:scale-105 hover:bg-slate-50 hover:text-slate-700 active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Address List Area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-white sm:px-8">
          {addresses.map((item) => {
            const isSelected = item.addressId === selectedAddressId;

            return (
              <button
                key={item.addressId}
                type="button"
                onClick={() => onSelect(item)}
                className={`
                  group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5
                  ${isSelected
                    ? "border-red-500 bg-gradient-to-br from-red-50/60 to-white shadow-lg shadow-red-100/40"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute inset-y-0 left-0 w-1 bg-red-500" />
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 sm:gap-4">
                    <div
                      className={`
                        mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl
                        ${isSelected
                          ? "bg-red-100/70"
                          : "bg-slate-50 group-hover:bg-slate-100"
                        }
                      `}
                    >
                      <MapPin
                        size={18}
                        className={isSelected ? "text-red-500" : "text-slate-400 group-hover:text-slate-600"}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold tracking-wide text-slate-900 sm:text-base">
                          {item.title}
                        </p>
                        {isSelected && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold text-red-600 uppercase tracking-wider">
                            Delivery To
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 break-words sm:text-sm sm:leading-6">
                        {item.address}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    {isSelected ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm sm:h-7 sm:w-7">
                        <Check size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full border border-slate-300 bg-white group-hover:border-slate-400 sm:h-7 sm:w-7" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add New Trigger Card */}
          <button
            type="button"
            onClick={onAddNew}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-4 text-sm font-semibold text-slate-600 transition-all hover:border-red-300 hover:bg-red-50/30 hover:text-red-600 sm:rounded-3xl sm:py-5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 transition-transform group-hover:scale-105 sm:h-9 sm:w-9">
              <Plus size={14} className="sm:w-4 sm:h-4" />
            </div>
            <span>Add New Address</span>
          </button>
        </div>

        {/* Action Controls Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-4 shrink-0 gap-4 sm:px-8 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold tracking-widest text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95 sm:rounded-2xl"
          >
            CLOSE
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedAddressId}
            className="flex-1 sm:flex-none rounded-xl bg-red-600 px-6 py-3 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-500/10 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none sm:rounded-2xl sm:px-8"
          >
            <span className="sm:hidden">Continue</span>
            <span className="hidden sm:inline">Continue to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
