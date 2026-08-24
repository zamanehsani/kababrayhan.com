"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {X} from "lucide-react";
import { useSendOtpMutation, useGetCustomerAddressesQuery } from "../../../redux/api";
import { useVerifyOtpMutation } from "../../../redux/authApi";
import {
  saveVerifiedPhone,
  getCustomerName,
} from "@/app/lib/customerPortal";

type PhoneVerifyModalProps = {
  open: boolean;
  onClose: (didVerify?: boolean) => void;
  onChangePhone?: () => void;
  phone: string;
};

const PhoneVerifyModal: React.FC<PhoneVerifyModalProps> = ({ open, onClose, onChangePhone, phone }) => {
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

          try {
            await refetchAddresses();
          } catch (err) {
            console.warn("Failed to prefetch addresses after verification:", err);
          }

          onClose(true);
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

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-4xl shadow-2xl p-8 w-full max-w-sm relative">
        <button
          type="button"
          aria-label="Close phone modal"
          onClick={() => onClose(false)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-white text-red-500 shadow-sm transition-all duration-200 hover:bg-red-500 hover:text-white active:scale-95"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* <h2 className="text-xl font-medium mb-2 text-center tracking-wide">Verify Your Phone</h2> */}
        {/* <br/> */}
        <div className="text-center text-gray-500 text-sm tracking-wide">enter the code sent to <br/><span className="font-medium tracking-wide">{phone}</span></div>
        <button
          type="button"
          className="mt-2 mb-4 block w-full text-center text-xs text-red-600 font-bold underline disabled:text-gray-400 disabled:cursor-not-allowed"
          onClick={() => {
            if (onChangePhone) {
              onChangePhone();
              return;
            }

            onClose(false);
          }}
        >
          Change phone number
        </button>
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
                className="w-14 h-14 text-center border border-gray-200 rounded-full px-2 py-3 text-2xl font-bold tracking-widest focus:outline-none focus:border-red-500"
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value.replaceAll(/\D/g, ""))}
                autoFocus={idx === 0}
                required
              />
            ))}
          </div>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="w-full rounded-full bg-red-600 py-3 text-base font-medium tracking-widest text-white transition-all hover:bg-red-700 active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </button>
          <div className=" flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            className="text-xs text-red-600 font-bold underline disabled:text-gray-400 disabled:cursor-not-allowed"
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

  return createPortal(modalContent, document.body);
};

export default PhoneVerifyModal;
