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
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all hover:scale-105 hover:text-slate-700"
        >
          <X size={16} />
        </button>
        {/* Header */}
        <div className="border-b border-slate-100 px-8 pb-6 pt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
              <MapPin size={22} className="text-red-500" />
            </div>

            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          </div>
        </div>
        {/* Address List */}
        <div className="max-h-[480px] overflow-y-auto px-8 py-6 space-y-4">
          {addresses.map((item) => {
            const isSelected = item.addressId === selectedAddressId;

            return (
              <button
                key={item.addressId}
                type="button"
                onClick={() => onSelect(item)}
                className={`
                  group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200
                  ${
                    isSelected
                      ? "border-red-500 bg-gradient-to-br from-red-50 to-white shadow-lg shadow-red-100/50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                  }
                `}
              >
                {/* Active Glow */}
                {isSelected && (
                  <div className="absolute inset-y-0 left-0 w-1 rounded-full bg-red-500" />
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`
                        mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                        ${
                          isSelected
                            ? "bg-red-100"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }
                      `}
                    >
                      <MapPin
                        size={18}
                        className={
                          isSelected ? "text-red-500" : "text-slate-500"
                        }
                      />
                    </div>

                    {/* Content */}
                    <div className="min-w-0">
                      <p className="text-base font-semibold tracking-wide text-slate-900">
                        {item.title}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500 break-words">
                        {item.address}
                      </p>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md">
                        <Check size={14} />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full border border-slate-300 bg-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Add New Address */}
          <button
            type="button"
            onClick={onAddNew}
            className="group flex w-full items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm font-semibold tracking-wide text-slate-700 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-105">
              <Plus size={16} />
            </div>

            <span>Add New Address</span>
          </button>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold tracking-[0.18em] text-slate-600 transition-all hover:bg-slate-100"
          >
            CLOSE
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedAddressId}
            className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
