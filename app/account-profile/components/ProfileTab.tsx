"use client";

import { useState } from "react";
import { Mail, PencilLine, Phone, UserRound, X } from "lucide-react";
import type { CustomerDetails } from "@/app/redux/apiType";
import { useSetCustomerInfoMutation } from "@/app/redux/api";
import PhoneModal from "../../components/home/modal/PhoneModal";
import PhoneVerifyModal from "../../components/home/modal/PhoneVerifyModal";
import {
  PHONE_KEY,
  PHONE_STATUS_KEY,
  dispatchCustomerPortalUpdated,
  initializeCustomerPortalSession,
  saveVerifiedPhone,
} from "@/app/lib/customerPortal";

type ProfileTabProps = {
  customerProfile?: CustomerDetails;
  fullName: string;
  emailAddress: string;
  profilePhone: string;
  customerName: string;
  portalPhone: string;
  onRefresh: () => void;
  onFeedback: (feedback: { type: "success" | "error"; message: string }) => void;
  onRefetchAddresses: () => void;
};

export default function ProfileTab({
  customerProfile,
  fullName,
  emailAddress,
  profilePhone,
  customerName,
  portalPhone,
  onRefresh,
  onFeedback,
  onRefetchAddresses,
}: ProfileTabProps) {
  const [setCustomerInfo] = useSetCustomerInfoMutation();
  const [emailEditorOpen, setEmailEditorOpen] = useState(false);
  const [pendingEmailValue, setPendingEmailValue] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [previousVerifiedPhone, setPreviousVerifiedPhone] = useState("");

  const handleOpenPhoneUpdate = () => {
    setPreviousVerifiedPhone(portalPhone);
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_STATUS_KEY);
    setShowPhoneModal(true);
  };

  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);
    if (!phoneJustSaved) {
      onRefresh();
      return;
    }
    setPhoneForVerify(phoneJustSaved);
    setShowVerifyModal(true);
  };

  const handleVerifyModalClose = () => {
    setShowVerifyModal(false);
    const status = globalThis.localStorage.getItem(PHONE_STATUS_KEY);

    if (status === "verified") {
      const newPhone = globalThis.localStorage.getItem(PHONE_KEY) || "";

      if (pendingEmailValue && customerName) {
        setCustomerInfo({ customerName, fieldname: "email_id", value: pendingEmailValue })
          .then(() => {
            onFeedback({ type: "success", message: "Email updated successfully." });
            setPendingEmailValue("");
          })
          .catch((error: unknown) => {
            console.warn("Failed to update customer email_id:", error);
            onFeedback({ type: "error", message: "Failed to update email. Please try again." });
          });
      }

      if (customerName && newPhone && customerName !== newPhone) {
        setCustomerInfo({ customerName, fieldname: "mobile_no", value: newPhone }).catch(
          (error: unknown) => console.warn("Failed to update customer mobile_no:", error)
        );
      }

      onRefresh();
      onRefetchAddresses();
      return;
    }

    if (previousVerifiedPhone) {
      saveVerifiedPhone(previousVerifiedPhone);
    } else {
      globalThis.localStorage.removeItem(PHONE_KEY);
      globalThis.localStorage.removeItem(PHONE_STATUS_KEY);
      initializeCustomerPortalSession();
      dispatchCustomerPortalUpdated();
    }
    onRefresh();
  };

  const handleChangePhoneFromVerify = () => {
    setShowVerifyModal(false);
    setPhoneForVerify("");
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_STATUS_KEY);
    setShowPhoneModal(true);
  };

  const handleEmailSave = () => {
    if (!pendingEmailValue.trim() || !customerName) return;
    setEmailEditorOpen(false);
    setPhoneForVerify(portalPhone);
    setShowVerifyModal(true);
  };

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-inner shadow-red-100"><UserRound size={24} /></div>
            <div>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{fullName}</h2>
              <p className="mt-1 text-sm text-slate-500">{customerProfile?.customer_name || "Customer profile"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Mail size={18} /></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p><p className="mt-1 text-sm text-slate-700">{emailAddress}</p></div></div>
              <button type="button" onClick={() => { setPendingEmailValue(emailAddress === "No email added yet" ? "" : emailAddress); setEmailEditorOpen(true); }} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-red-200 hover:text-red-600" aria-label="Edit email"><PencilLine size={15} /></button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600"><Phone size={18} /></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p><p className="mt-1 text-sm text-slate-700">{profilePhone}</p></div></div>
              <button type="button" onClick={handleOpenPhoneUpdate} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-red-200 hover:text-red-600" aria-label="Edit phone"><PencilLine size={15} /></button>
            </div>
          </div>
        </div>
      </div>

      {showPhoneModal && <PhoneModal open={true} allowExistingPhone={true} onClose={handlePhoneModalClose} />}
      {showVerifyModal && <PhoneVerifyModal open={true} phone={phoneForVerify} onClose={handleVerifyModalClose} onChangePhone={handleChangePhoneFromVerify} />}

      {emailEditorOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Update email</p><h3 className="mt-2 text-xl font-semibold text-slate-900">Edit your email address</h3></div><button type="button" onClick={() => setEmailEditorOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:text-red-600" aria-label="Close edit email"><X size={16} /></button></div>
            <label className="mt-5 block text-sm font-medium text-slate-700">Email address<input type="email" value={pendingEmailValue} onChange={(event) => setPendingEmailValue(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:bg-white" placeholder="name@example.com" /></label>
            <div className="mt-6 flex items-center justify-end gap-3"><button type="button" onClick={() => setEmailEditorOpen(false)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Cancel</button><button type="button" onClick={handleEmailSave} disabled={!pendingEmailValue.trim()} className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300">Verify & save</button></div>
          </div>
        </div>
      )}
    </>
  );
}
