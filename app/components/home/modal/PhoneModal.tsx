"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSendOtpMutation } from "../../../redux/api";
import { X } from "lucide-react";
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

  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";

  let normalized = digitsOnly;
  if (normalized.startsWith("00971")) normalized = normalized.slice(5);
  else if (normalized.startsWith("971")) normalized = normalized.slice(3);

  if (!normalized) return "";
  if (!/^5\d{8}$/.test(normalized)) {
    return normalized.startsWith("0") ? normalized : `0${normalized}`;
  }

  return `0${normalized}`;
};

const normalizeUaeMobile = (value: string) => {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return { valid: false, normalized: "", otpMobile: "" };

  let mobile = digitsOnly;
  if (mobile.startsWith("00971")) mobile = mobile.slice(5);
  else if (mobile.startsWith("971")) mobile = mobile.slice(3);

  mobile = mobile.replace(/^0+/, "");

  if (!/^5\d{8}$/.test(mobile)) {
    return { valid: false, normalized: "", otpMobile: "" };
  }

  return {
    valid: true,
    normalized: `+971${mobile}`,
    otpMobile: `971${mobile}`,
  };
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

    const normalizedPhone = normalizeUaeMobile(phoneRest);
    if (!normalizedPhone.valid) {
      setError("Please enter a valid UAE mobile number like 0501234567 or 971501234567.");
      return;
    }

    try {
      const result = await sendOtp({ mobile: normalizedPhone.otpMobile }).unwrap();
      if (result.status === "success") {
        saveEnteredPhone(normalizedPhone.normalized);
        setError("");
        onClose(normalizedPhone.normalized);
      } else {
        setError("Failed to send OTP. Try again.");
      }
    } catch (error) {
      console.error("Failed to send OTP", error);
      setError("Failed to send OTP. Try again.");
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-sm rounded-4xl bg-white p-8 shadow-2xl">
        <button
          type="button"
          aria-label="Close phone modal"
          onClick={() => onClose(undefined)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition-all duration-200 hover:bg-red-500 hover:text-white active:scale-95"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <h2 className="my-3 text-center text-xl font-medium tracking-wide">Enter your Number</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {/* <span className="px-3 py-2 rounded-lg bg-gray-100 border border-gray-200 select-none">+971</span> */}
            <input
              type="tel"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-lg focus:outline-none focus:border-red-500"
              placeholder="052345678"
              value={phoneRest}
              onChange={(e) => setPhoneRest(e.target.value.replace(/\D/g, ""))}
              maxLength={15}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-full bg-red-600 py-3 text-base font-medium uppercase tracking-widest text-white transition-all hover:bg-red-700 active:scale-[0.98]"
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
