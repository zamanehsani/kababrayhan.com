"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";

type UpdateDecisionModalProps = {
  open: boolean;
  title: string;
  description: string;
  detail?: string;
  confirmLabel: string;
  skipLabel: string;
  onConfirm: () => void;
  onSkip: () => void;
};

export default function UpdateDecisionModal({
  open,
  title,
  description,
  detail,
  confirmLabel,
  skipLabel,
  onConfirm,
  onSkip,
}: Readonly<UpdateDecisionModalProps>) {
  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 px-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onSkip}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-700"
          aria-label="Close decision modal"
        >
          <X size={16} />
        </button>

        <h3 className="text-lg font-medium tracking-wide text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-sm font-normal tracking-wide text-slate-500">
          {description}
        </p>

        {detail && (
          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center">
            <p className="font-semibold text-slate-800 tracking-wide break-all">
              {detail}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium  tracking-widest text-slate-600 transition-colors hover:bg-slate-50"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-medium  tracking-widest text-white transition-colors hover:bg-red-700"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
