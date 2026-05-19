"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
} from "lucide-react";
import DesktopHeader from "../components/Header/DesktopHeader";
import PhoneModal from "../components/home/modal/PhoneModal";
import PhoneVerifyModal from "../components/home/modal/PhoneVerifyModal";
import AddressSelectModal, {
  type SelectedAddress,
} from "../components/home/modal/AddressSelectModal";
import {
  CUSTOMER_PORTAL_UPDATED,
  PHONE_KEY,
  PHONE_STATUS_KEY,
  dispatchCustomerPortalUpdated,
  initializeCustomerPortalSession,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
  saveVerifiedPhone,
} from "@/app/lib/customerPortal";

export default function AccountProfilePage() {
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [previousVerifiedPhone, setPreviousVerifiedPhone] = useState("");

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener("storage", refreshPortalState);

    return () => {
      globalThis.removeEventListener(
        CUSTOMER_PORTAL_UPDATED,
        refreshPortalState
      );
      globalThis.removeEventListener("storage", refreshPortalState);
    };
  }, [refreshPortalState]);

  const handleOpenPhoneUpdate = () => {
    setPreviousVerifiedPhone(portalState.isVerified ? portalState.phone : "");
    setShowPhoneModal(true);
  };

  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);

    if (!phoneJustSaved) {
      refreshPortalState();
      return;
    }

    setPhoneForVerify(phoneJustSaved);
    setShowVerifyModal(true);
  };

  const handleVerifyModalClose = () => {
    setShowVerifyModal(false);

    const status = globalThis.localStorage.getItem(PHONE_STATUS_KEY);
    if (status === "verified") {
      refreshPortalState();
      return;
    }

    // Revert temporary phone update if verification did not succeed.
    if (previousVerifiedPhone) {
      saveVerifiedPhone(previousVerifiedPhone);
    } else {
      globalThis.localStorage.removeItem(PHONE_KEY);
      globalThis.localStorage.removeItem(PHONE_STATUS_KEY);
      initializeCustomerPortalSession();
      dispatchCustomerPortalUpdated();
    }

    refreshPortalState();
  };

  const handleAddressSelect = (addressData: SelectedAddress) => {
    saveDeliveryAddress(addressData.name);
    refreshPortalState();
    setShowAddressModal(false);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 lg:py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium tracking-wide text-stone-600 transition-colors hover:bg-stone-50"
        >
          <ChevronLeft size={14} />
          Back to Home
        </Link>

        <section className="space-y-6 rounded-3xl border border-stone-100 bg-white p-6 shadow-sm lg:p-8">
          <div className="border-b border-stone-100 pb-4">
            <h1 className="text-2xl font-medium tracking-wide text-stone-900">
              Account Profile
            </h1>
            <p className="mt-1 text-sm font-normal tracking-wide text-stone-500">
              Manage your verified phone and delivery details.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Verified Phone
                  </p>
                  <p className="text-base font-medium tracking-wide text-stone-900">
                    {portalState.isVerified && portalState.phone
                      ? portalState.phone
                      : "Not verified yet"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenPhoneUpdate}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-stone-800"
              >
                <Pencil size={14} />
                {portalState.isVerified ? "Update Phone" : "Verify Phone"}
              </button>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium tracking-wide text-emerald-700">
              <ShieldCheck size={13} />
              {portalState.isVerified
                ? "Phone verified"
                : "Verification required for checkout"}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-stone-100 bg-stone-50/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Delivery Address
                  </p>
                  <p className="max-w-xl text-sm font-medium tracking-wide text-stone-900">
                    {portalState.address || "No address saved yet"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-widest text-stone-700 transition-colors hover:bg-stone-50"
              >
                {portalState.address ? "Update Address" : "Add Address"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {showPhoneModal && (
        <PhoneModal
          open={showPhoneModal}
          allowExistingPhone
          onClose={handlePhoneModalClose}
        />
      )}

      {showVerifyModal && (
        <PhoneVerifyModal
          open={showVerifyModal}
          phone={phoneForVerify}
          onClose={handleVerifyModalClose}
        />
      )}

      {showAddressModal && (
        <AddressSelectModal
          open={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onSelect={handleAddressSelect}
          redirectTo={null}
        />
      )}
    </main>
  );
}
