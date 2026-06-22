"use client";

import React from "react";

interface PaymentErrorSectionProps {
  errorMessage: string;
  isInitializing: boolean;
  onRetry: () => void;
}

const PaymentErrorSection: React.FC<PaymentErrorSectionProps> = ({
  errorMessage,
  isInitializing,
  onRetry,
}) => {
  return (
    <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-2">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-red-600 text-sm font-semibold mb-2 px-4">{errorMessage}</p>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <button
          type="button"
          onClick={onRetry}
          disabled={isInitializing}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-all active:scale-95 disabled:scale-100"
        >
          {isInitializing ? "Retrying..." : "Retry Setup"}
        </button>
      </div>
    </div>
  );
};

export default PaymentErrorSection;