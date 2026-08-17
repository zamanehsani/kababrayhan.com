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
    <div className=" border-t border-stone-100 pt-3 space-y-2.5">
      <textarea
        value={note}
        onChange={handleChange}
        onBlur={onBlurSave}
        placeholder="Any note for the chef? (e.g. dietary preferences)"
        rows={3}
        className="w-full rounded-xl border border-red-200 p-3.5 placeholder-stone-400/90 focus:border-red-400 focus:outline-none transition-all resize-none bg-stone-50/30"
      />

      <div className="flex items-end justify-between gap-3 text-xs text-stone-400">
        <span className={note.length >= characterLimit ? "font-bold text-red-600" : ""}>
          {note.length}/{characterLimit}
        </span>
      </div>
    </div>
  );
};

export default CustomerNote;

