"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSendOtpMutation } from "../../../redux/api";
import {
  PHONE_KEY,
  PHONE_STATUS_KEY,
  saveEnteredPhone,
} from "@/app/lib/customerPortal";

type PhoneModalProps = {
  open: boolean;
  onClose: (phoneJustSaved?: string) => void;
  allowExistingPhone?: boolean;
  initialPhone?: string;
};

const deriveInitialPhoneRest = (value: string) => {
  if (!value) return "";

  const digitsOnly = value.replace(/\D/g, "").replace(/^971/, "");
  return digitsOnly.replace(/^0+/, "");
};

const PhoneModal: React.FC<PhoneModalProps> = ({
  open,
  onClose,
  allowExistingPhone = false,
  initialPhone = "",
}) => {
  const [phoneRest, setPhoneRest] = useState(() => deriveInitialPhoneRest(initialPhone));
  const [error, setError] = useState("");
  const [sendOtp, { isLoading }] = useSendOtpMutation();

  // If phone is already entered, do not show modal
  useEffect(() => {
    if (allowExistingPhone) return;

    const phone = localStorage.getItem(PHONE_KEY);
    const status = localStorage.getItem(PHONE_STATUS_KEY);
    if (open && phone && (status === "entered" || status === "verified")) {
      // Phone entered, close this modal and let parent show verify modal
      onClose(phone);
    }
  }, [allowExistingPhone, open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    // UAE phone validation: must start with 5 and be 9 digits
    const cleaned = phoneRest.replaceAll(/\s+/g, "");
    if (/^5\d{8}$/.test(cleaned)) {
      const fullPhone = "+971" + cleaned;
      try {
        // Send OTP
        const result = await sendOtp({ mobile: "971" + cleaned }).unwrap();
        if (result.status === "success") {
          saveEnteredPhone(fullPhone);
          setError("");
          onClose(fullPhone);
        } else {
          setError("Failed to send OTP. Try again.");
        }
      } catch (error) {
        console.error("Failed to send OTP", error);
        setError("Failed to send OTP. Try again.");
      }
    } else {
      setError("Please enter a valid UAE mobile number (5XXXXXXXX).");
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={() => onClose(undefined)}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-xl font-black"
          aria-label="Close phone modal"
        >
          ×
        </button>
        <h2 className="text-xl font-meduim mb-4 text-center  tracking-wide">Enter your Phone Number</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-3 rounded-lg bg-gray-100 border border-gray-200 text-lg select-none">+971</span>
            <input
              type="tel"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-red-500"
              placeholder="5XXXXXXXX"
              value={phoneRest}
              onChange={(e) => setPhoneRest(e.target.value.replaceAll(/\D/g, ""))}
              maxLength={9}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-base font-medium uppercase tracking-widest text-white transition-all hover:bg-red-700 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PhoneModal;
