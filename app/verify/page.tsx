"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useSendOtpMutation } from "@/app/redux/api";
import { useVerifyOtpMutation } from "@/app/redux/authApi";
import { ensureCustomerForPhone } from "@/app/lib/customerAccount";
import {
  readCustomerPortalSnapshot,
  saveEnteredPhone,
  saveVerifiedPhone,
} from "@/app/lib/customerPortal";

const NEXT_ROUTE = "/delivery-address";
const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

const normalizeUaeMobile = (value: string) => {
  const digitsOnly = value.replaceAll(/\D/g, "");
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

const toLocalInput = (phone: string) => {
  const digits = phone.replaceAll(/\D/g, "");
  if (!digits) return "";
  const local = digits.startsWith("971") ? digits.slice(3) : digits;
  return local ? `0${local.replace(/^0+/, "")}` : "";
};

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState(() =>
    toLocalInput(readCustomerPortalSnapshot().phone)
  );
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const otpInputRef = useRef<HTMLInputElement>(null);

  const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const requestOtp = useCallback(
    async (normalized: { normalized: string; otpMobile: string }) => {
      const result = await sendOtp({ mobile: normalized.otpMobile }).unwrap();
      if (result.status !== "success") {
        throw new Error("Failed to send OTP.");
      }
      saveEnteredPhone(normalized.normalized);
      setResendTimer(RESEND_SECONDS);
    },
    [sendOtp]
  );

  const handlePhoneSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeUaeMobile(phoneInput);

    if (!normalized.valid) {
      setError("Enter a valid UAE mobile number, e.g. 0501234567.");
      return;
    }

    try {
      setError("");
      await requestOtp(normalized);
      setPhone(normalized.normalized);
      setCode("");
      setStep("otp");
    } catch (sendError) {
      console.error("Failed to send OTP", sendError);
      setError("We couldn't send the code. Please try again.");
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isSendingOtp) return;
    const normalized = normalizeUaeMobile(phone);
    if (!normalized.valid) return;

    try {
      setError("");
      await requestOtp(normalized);
    } catch (resendError) {
      console.error("Failed to resend OTP", resendError);
      setError("We couldn't resend the code. Please try again.");
    }
  };

  const handleCodeChange = (rawValue: string) => {
    setCode(rawValue.replaceAll(/\D/g, "").slice(0, OTP_LENGTH));
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    try {
      setError("");
      const result = await verifyOtp({ mobile: phone, otp: code }).unwrap();

      if (result.status !== "success") {
        setError("Invalid code. Please try again.");
        return;
      }
    } catch (verifyError) {
      console.error("OTP verification failed", verifyError);
      setError("Invalid code. Please try again.");
      return;
    }

    try {
      saveVerifiedPhone(phone);
      setIsCreatingCustomer(true);
      await ensureCustomerForPhone(phone);
      router.replace(NEXT_ROUTE);
    } catch (accountError) {
      console.error("Customer setup failed", accountError);
      setIsCreatingCustomer(false);
      setError(
        accountError instanceof Error
          ? accountError.message
          : "Verified, but we couldn't set up your account. Please try again."
      );
    }
  };

  const isBusy = isSendingOtp || isVerifyingOtp || isCreatingCustomer;

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-1 w-full max-w-sm flex-col gap-y-2 p-5 sm:p-6 ">
        {step === "otp" && (
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError("");
            }}
            className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft size={14} />
            Change number
          </button>
        )}

        <h1 className="text-center text-lg sm:text-xl font-semibold tracking-wide text-slate-900">
          {step === "phone" ? "Enter your phone number" : "Verify your number"}
        </h1>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-500">
          {step === "phone"
            ? "We'll text you a code to confirm your order."
            : `Code sent to ${phone}`}
        </p>

        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="mt-5 flex flex-col gap-3.5">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 focus-within:border-red-500">
              <span className="text-sm font-semibold text-slate-500">+971</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                placeholder="0501234567"
                className="w-full bg-transparent text-sm sm:text-base tracking-wide outline-hidden"
                required
              />
            </div>

            {error && (
              <p className="text-center text-xs sm:text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-semibold tracking-wide text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
            >
              {isSendingOtp && <Loader2 size={16} className="animate-spin" />}
              {isSendingOtp ? "Sending code..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="mt-5 flex flex-col gap-3.5">
            {/* One real input behind the boxes so paste/autofill fills every digit. */}
            <button
              type="button"
              onClick={() => otpInputRef.current?.focus()}
              className="relative flex justify-center gap-2.5"
              aria-label="Enter verification code"
            >
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                value={code}
                onChange={(event) => handleCodeChange(event.target.value)}
                autoFocus
                className="absolute inset-0 h-full w-full cursor-default opacity-0 outline-hidden"
              />
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <span
                  key={`otp-slot-${index}`}
                  className={`flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border text-xl sm:text-2xl font-bold tracking-widest ${
                    index === Math.min(code.length, OTP_LENGTH - 1)
                      ? "border-red-500 bg-red-50/20"
                      : "border-slate-200"
                  }`}
                >
                  {code[index] ?? ""}
                </span>
              ))}
            </button>

            {error && (
              <p className="text-center text-xs sm:text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-semibold tracking-wide text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
            >
              {isBusy && <Loader2 size={16} className="animate-spin" />}
              {isCreatingCustomer
                ? "Setting up your account..."
                : isVerifyingOtp
                  ? "Verifying..."
                  : "Verify"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0 || isSendingOtp}
              className="text-center text-xs font-bold text-red-600 underline disabled:text-slate-400 disabled:no-underline"
            >
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
