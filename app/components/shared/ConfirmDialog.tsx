"use client";

import { AlertTriangle, Info, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  showCancel?: boolean;
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  showCancel = true,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: <AlertTriangle size={48} className="text-red-500" />,
      iconBg: "bg-red-50",
      confirmBtn: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200",
      border: "border-red-100",
    },
    warning: {
      icon: <AlertTriangle size={48} className="text-red-500" />,
      iconBg: "bg-orange-50",
      confirmBtn: "bg-red-500 hover:bg-orange-600 text-white shadow-lg shadow-red-200",
      border: "border-red-100",
    },
    info: {
      icon: <Info size={48} className="text-blue-500" />,
      iconBg: "bg-blue-50",
      confirmBtn: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200",
      border: "border-blue-100",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className={`bg-white rounded-3xl border-2 ${styles.border} shadow-2xl overflow-hidden`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>

          {/* Icon */}
          <div className="flex justify-center pt-8 pb-4">
            <div className={`${styles.iconBg} rounded-full p-4`}>
              {styles.icon}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold text-sm uppercase tracking-wide hover:bg-slate-50 transition-all active:scale-95"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all active:scale-95 ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
