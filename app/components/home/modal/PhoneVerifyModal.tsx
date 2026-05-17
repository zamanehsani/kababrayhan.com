"use client";

/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState, useRef, useEffect } from "react";
import { useVerifyOtpMutation, useSendOtpMutation } from "../../../redux/api";

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
  const inputsRef = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  if (!open) return null;

  const PHONE_STATUS_KEY = "uae_phone_status";
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (/^\d{4}$/.test(code)) {
      try {
        const mobile = phone.replace("+", "").replace(/^0+/, "");
        const result = await verifyOtp({ mobile, otp: code }).unwrap();
        if (result.status === "success") {
          localStorage.setItem(PHONE_STATUS_KEY, "verified");
          setError("");
          onClose();
        } else {
          setError("Invalid code. Please try again.");
        }
      } catch (err) {
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
      const mobile = phone.replace("+", "").replace(/^0+/, "");
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
    if (!/^[0-9]?$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[idx] = val;
    setDigits(newDigits);
    if (val && idx < 3) {
    //   @ts-expect-error
      inputsRef[idx + 1].current?.focus();
    }
    if (!val && idx > 0) {
      // @ts-ignore
      inputsRef[idx - 1].current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl font-black"
          aria-label="Close verification modal"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2 text-center">Verify Your Phone</h2>
        <div className="text-center text-gray-500 mb-4 text-sm">We sent a 4-digit code to <span className="font-bold">{phone}</span></div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3 justify-center">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputsRef[idx]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                className="w-14 h-16 text-center border border-gray-200 rounded-lg px-2 py-3 text-2xl font-bold tracking-widest focus:outline-none focus:border-red-500"
                value={digit}
                onChange={e => handleDigitChange(idx, e.target.value.replace(/[^0-9]/g, ""))}
                autoFocus={idx === 0}
                required
              />
            ))}
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-xl bg-red-600 py-3 text-base font-black uppercase tracking-widest text-white transition-all hover:bg-red-700 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          <div className="text-center mt-2">
            <button
              type="button"
              className="text-xs text-red-600 font-bold underline disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={resendTimer > 0 || isResending}
            >
              {resendTimer > 0
                ? `Resend code in ${resendTimer}s`
                : isResending
                ? "Resending..."
                : resent
                ? "Resent! Send again?"
                : "Resend code"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PhoneVerifyModal;
