"use client";

import React, { useState, useEffect } from "react";
import { useSendOtpMutation } from "../../../redux/api";

type PhoneModalProps = {
  open: boolean;
  onClose: (phoneJustSaved?: string) => void;
};


const PHONE_KEY = "uae_phone";
const PHONE_STATUS_KEY = "uae_phone_status"; // 'entered' | 'verified'

const PhoneModal: React.FC<PhoneModalProps> = ({ open, onClose }) => {
  const [phoneRest, setPhoneRest] = useState("");
  const [error, setError] = useState("");
  const [sendOtp, { isLoading }] = useSendOtpMutation();

  // If phone is already entered, do not show modal
  useEffect(() => {
    const phone = localStorage.getItem(PHONE_KEY);
    const status = localStorage.getItem(PHONE_STATUS_KEY);
    if (open && phone && status === "entered") {
      // Phone entered, close this modal and let parent show verify modal
      onClose(phone);
    }
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // UAE phone validation: must start with 5 and be 9 digits
    const cleaned = phoneRest.replace(/\s+/g, "");
    if (/^5\d{8}$/.test(cleaned)) {
      const fullPhone = "+971" + cleaned;
      try {
        // Send OTP
        const result = await sendOtp({ mobile: "971" + cleaned }).unwrap();
        if (result.status === "success") {
          localStorage.setItem(PHONE_KEY, fullPhone);
          localStorage.setItem(PHONE_STATUS_KEY, "entered");
          setError("");
          onClose(fullPhone);
        } else {
          setError("Failed to send OTP. Try again.");
        }
      } catch (err) {
        setError("Failed to send OTP. Try again.");
      }
    } else {
      setError("Please enter a valid UAE mobile number (5XXXXXXXX).");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={() => onClose()}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-black"
          aria-label="Close phone modal"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">Enter your UAE Phone Number</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-3 rounded-lg bg-gray-100 border border-gray-200 text-lg select-none">+971</span>
            <input
              type="tel"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-red-500"
              placeholder="5XXXXXXXX"
              value={phoneRest}
              onChange={e => setPhoneRest(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={9}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-base font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhoneModal;
