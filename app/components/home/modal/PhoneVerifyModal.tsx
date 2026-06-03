"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSendOtpMutation, useGetCustomerAddressesQuery } from "../../../redux/api";
import { useVerifyOtpMutation } from "../../../redux/authApi";
import {
  saveVerifiedPhone,
  getCustomerName,
} from "@/app/lib/customerPortal";

type PhoneVerifyModalProps = {
  open: boolean;
  onClose: () => void;
  phone: string;
};

const PhoneVerifyModal: React.FC<PhoneVerifyModalProps> = ({ open, onClose, phone }) => {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [sendOtp, { isLoading: isResending }] = useSendOtpMutation();
  const [resendTimer, setResendTimer] = useState(0);
  const [resent, setResent] = useState(false);
  const inputsRef = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const otpSlotKeys = ["otp-1", "otp-2", "otp-3", "otp-4"] as const;

  // Pre-fetch addresses query so we can refetch after verification
  const customerName = getCustomerName() || phone;
  const { refetch: refetchAddresses } = useGetCustomerAddressesQuery(
    customerName,
    { skip: true } // Initially skip, we'll refetch manually after verification
  );

  // Timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  if (!open) return null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = digits.join("");
    if (/^\d{4}$/.test(code)) {
      try {
        const mobile = phone.startsWith("+") ? phone : `+${phone}`;
        const result = await verifyOtp({ mobile, otp: code }).unwrap();
        if (result.status === "success") {
          saveVerifiedPhone(phone);
          setError("");
          
          // Immediately fetch addresses after successful verification
          // This ensures addresses are loaded before user navigates to account-profile
          try {
            await refetchAddresses();
          } catch (err) {
            console.warn("Failed to prefetch addresses after verification:", err);
          }
          
          onClose();
        } else {
          setError("Invalid code. Please try again.");
        }
      } catch (error) {
        console.error("OTP verification failed", error);
        setError("Invalid code. Please try again.");
      }
    } else {
      setError("Please enter the 4-digit code.");
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setError("");
    try {
      const mobile = phone.startsWith("+") ? phone : `+${phone}`;
      const result = await sendOtp({ mobile }).unwrap();
      if (result.status === "success") {
        setResent(true);
        setResendTimer(60);
      } else {
        setError("Failed to resend code. Try again.");
      }
    } catch {
      setError("Failed to resend code. Try again.");
    }
  };

  const handleDigitChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[idx] = val;
    setDigits(newDigits);
    if (val && idx < 3) {
      inputsRef[idx + 1].current?.focus();
    }
    if (!val && idx > 0) {
      inputsRef[idx - 1].current?.focus();
    }
  };

  let resendLabel = "Resend code";
  if (resendTimer > 0) {
    resendLabel = `Resend code in ${resendTimer}s`;
  } else if (isResending) {
    resendLabel = "Resending...";
  } else if (resent) {
    resendLabel = "Resent! Send again?";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-brand-400 text-2xl font-black"
          aria-label="Close verification modal"
        >
          ×
        </button>
        <h2 className="text-xl font-medium mb-2 text-center tracking-wide">Verify Your Phone</h2>
        <div className="text-center text-gray-500 mb-4 text-sm tracking-wide">We sent a 4-digit code to <span className="font-medium tracking-wide">{phone}</span></div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3 justify-center">
            {digits.map((digit, idx) => (
              <input
                key={otpSlotKeys[idx]}
                ref={inputsRef[idx]}
                type="text"
                inputMode="numeric"
                pattern="\d"
                maxLength={1}
                className="w-14 h-16 text-center border border-gray-200 rounded-lg px-2 py-3 text-2xl font-bold tracking-widest focus:outline-none focus:border-red-500"
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value.replaceAll(/\D/g, ""))}
                autoFocus={idx === 0}
                required
              />
            ))}
          </div>
          {error && <div className="text-brand-400 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-400 py-3 text-base font-medium uppercase tracking-widest text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          <div className="text-center mt-2">
            <button
              type="button"
              className="text-xs text-brand-400 font-bold underline disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={resendTimer > 0 || isResending}
            >
              {resendLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhoneVerifyModal;
