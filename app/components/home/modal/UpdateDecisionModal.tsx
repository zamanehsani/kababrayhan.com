"use client";

type UpdateDecisionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  skipLabel: string;
  onConfirm: () => void;
  onSkip: () => void;
};

export default function UpdateDecisionModal({
  open,
  title,
  description,
  confirmLabel,
  skipLabel,
  onConfirm,
  onSkip,
}: Readonly<UpdateDecisionModalProps>) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-medium tracking-wide text-slate-900">{title}</h3>
        <p className="mt-2 text-sm font-normal tracking-wide text-slate-500">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50"
          >
            {skipLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-brand-400 px-4 py-2 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-brand-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
