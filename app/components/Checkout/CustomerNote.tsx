"use client";

import React, { ChangeEvent } from "react";

interface CustomerNoteProps {
  note: string;
  onNoteChange: (value: string) => void;
  onBlurSave: () => void;
}

const CustomerNote: React.FC<CustomerNoteProps> = ({
  note,
  onNoteChange,
  onBlurSave,
}) => {
  const characterLimit = 160;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= characterLimit) {
      onNoteChange(e.target.value);
    }
  };

  return (
    <div className="mt-6 border-t border-stone-100 pt-5 space-y-2.5">
      <div className="flex items-center gap-2">
        {/* Subtle decorative dot using your brand color */}
        <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
        <label className="text-xl font-medium tracking-wide text-stone-800">
          Add a note for your order
        </label>
      </div>
      
      <textarea
        value={note}
        onChange={handleChange}
        onBlur={onBlurSave}
        placeholder="Allergies, extra sauce, no onions, etc."
        rows={3}
        className="w-full rounded-xl border border-stone-200 p-3.5 text-[15px] leading-relaxed text-stone-900 placeholder-stone-400/90 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 transition-all resize-none bg-stone-50/30"
      />

      <div className="flex items-end justify-between gap-3 text-xs text-stone-400">
        <span>Custom adjustments may alter preparation time.</span>

        <span className={note.length >= characterLimit ? "font-bold text-red-600" : ""}>
          {note.length}/{characterLimit}
        </span>
      </div>
    </div>
  );
};

export default CustomerNote;

