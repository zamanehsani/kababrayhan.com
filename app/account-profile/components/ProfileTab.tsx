"use client";

import { useState } from "react";
import { PencilLine, Phone, UserRound, X } from "lucide-react";
import type { CustomerDetails } from "@/app/redux/apiType";
import {
  useRenameCustomerMutation,
  useUpdateCustomerMutation,
} from "@/app/redux/api";
import PhoneModal from "../../components/home/modal/PhoneModal";
import PhoneVerifyModal from "../../components/home/modal/PhoneVerifyModal";
import {
  PHONE_KEY,
  PHONE_STATUS_KEY,
  dispatchCustomerPortalUpdated,
  initializeCustomerPortalSession,
  saveCustomerName,
  saveVerifiedPhone,
} from "@/app/lib/customerPortal";
import { saveStoredCustomer } from "@/app/components/customerStorage";

type ProfileTabProps = {
  customerProfile?: CustomerDetails;
  profilePhone: string;
  customerName: string;
  portalPhone: string;
  onRefresh: () => void;
  onFeedback: (feedback: { type: "success" | "error"; message: string }) => void;
  onRefetchAddresses: () => void;
  onRefetchCustomer: () => Promise<CustomerDetails | undefined>;
};

export default function ProfileTab({
  customerProfile,
  profilePhone,
  customerName,
  portalPhone,
  onRefresh,
  onFeedback,
  onRefetchAddresses,
  onRefetchCustomer,
}: ProfileTabProps) {
  const [updateCustomer] = useUpdateCustomerMutation();
  const [renameCustomer] = useRenameCustomerMutation();
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const [pendingFirstName, setPendingFirstName] = useState("");
  const [pendingLastName, setPendingLastName] = useState("");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [previousVerifiedPhone, setPreviousVerifiedPhone] = useState("");
  const customerFullName = [
    customerProfile?.first_name,
    customerProfile?.last_name,
  ]
    .filter((name): name is string => Boolean(name?.trim()))
    .join(" ") || "Customer";
  const customerMobileNumber = customerProfile?.mobile_number || profilePhone;

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

  const handleVerifyModalClose = async () => {
    setShowVerifyModal(false);
    const status = globalThis.localStorage.getItem(PHONE_STATUS_KEY);

    if (status === "verified") {
      const newPhone = globalThis.localStorage.getItem(PHONE_KEY) || "";
      const phoneChanged = Boolean(customerName && newPhone && newPhone !== portalPhone);

      if (phoneChanged) {
        const updatedCustomer = await updateCustomer({
          customerName,
          customer_name: newPhone,
          mobile_no: newPhone,
          mobile_number: newPhone,
        }).unwrap();

        await renameCustomer({
          oldName: customerName,
          newName: newPhone,
        }).unwrap();

        saveCustomerName(newPhone);
        saveStoredCustomer({
          ...updatedCustomer,
          name: newPhone,
          customer_name: newPhone,
          mobile_no: newPhone,
          mobile_number: newPhone,
        });
      }

      if (!phoneChanged) {
        const refreshedCustomer = await onRefetchCustomer();
        if (refreshedCustomer) saveStoredCustomer(refreshedCustomer);
      }
      onRefresh();
      if (!phoneChanged) {
        onRefetchAddresses();
      }
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

  const handleNameSave = async () => {
    const firstName = pendingFirstName.trim();
    const lastName = pendingLastName.trim();
    if (!customerName || !firstName) return;

    try {
      const nameUpdate = {
        customerName,
        first_name: firstName,
        last_name: lastName,
      };
      console.log("Updating Frappe customer name:", nameUpdate);
      await updateCustomer(nameUpdate).unwrap();
      setNameEditorOpen(false);
      onFeedback({ type: "success", message: "Name updated successfully." });
      const refreshedCustomer = await onRefetchCustomer();
      if (refreshedCustomer) saveStoredCustomer(refreshedCustomer);
      onRefresh();
    } catch (error) {
      console.error("Failed to update customer name:", error);
      onFeedback({ type: "error", message: "Failed to update name. Please try again." });
    }
  };

  return (
    <>
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-inner shadow-red-100"><UserRound size={24} /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-slate-900">{customerFullName}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setPendingFirstName(customerProfile?.first_name || "");
                    setPendingLastName(customerProfile?.last_name || "");
                    setNameEditorOpen(true);
                  }}
                  className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:border-red-200 hover:text-red-600"
                  aria-label="Edit name"
                >
                  <PencilLine size={15} />
                </button>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Phone size={14} />
                {customerMobileNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
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

      {nameEditorOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">Update name</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Edit your name</h3>
              </div>
              <button
                type="button"
                onClick={() => setNameEditorOpen(false)}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:text-red-600"
                aria-label="Close edit name"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                First name
                <input
                  type="text"
                  value={pendingFirstName}
                  onChange={(event) => setPendingFirstName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:bg-white"
                  autoFocus
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Last name
                <input
                  type="text"
                  value={pendingLastName}
                  onChange={(event) => setPendingLastName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-300 focus:bg-white"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNameEditorOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNameSave}
                disabled={!pendingFirstName.trim()}
                className="rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                Save name
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
