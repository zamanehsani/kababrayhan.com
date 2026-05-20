"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import MobileHeader from "../components/Header/MobileHeader";
import TabletHeader from "../components/Header/TabletHeader";
import DesktopHeader from "../components/Header/DesktopHeader";
import BottomNav from "../components/home/BottomNav";
import CartSidebarWidget from "../components/Cart/CartSidebarWidget";
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

const toWordPreview = (value: string, maxWords: number) => {
  const normalized = value.trim().replaceAll(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  const words = normalized.split(" ");
  if (words.length <= maxWords) {
    return normalized;
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
};

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

  const phoneLabel =
    portalState.isVerified && portalState.phone
      ? portalState.phone
      : "Not verified yet";
  const addressLabel = portalState.address || "No address saved yet";
  const addressPreview = toWordPreview(addressLabel, 10);

  return (
    <main className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900">
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      <div className="hidden md:block lg:hidden">
        <TabletHeader />
      </div>

      <div className="hidden lg:block">
        <DesktopHeader />
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-orange-50/50 p-5 shadow-sm shadow-slate-200/40 sm:p-7 lg:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-400">
                Account
              </p>
              <h1 className="mt-2 text-xl font-normal leading-wide text-slate-900 sm:text-xl lg:text-2xl">
                Profile & Preferences
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                Manage your verified phone and delivery details for smoother
                checkout.
              </p>
            </div>

            <Link
              href="/home"
              className="inline-flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ChevronLeft size={14} />
              Back To Home
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-100/80">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Verification
              </p>
              <p className="mt-1 text-base font-semibold leading-tight text-slate-900">
                {portalState.isVerified ? "Verified" : "Pending"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-100/80">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Phone
              </p>
              <p className="mt-1 truncate text-base font-semibold leading-tight text-slate-900">
                {phoneLabel}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-100/80">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Address
              </p>
              <p className="mt-1 truncate text-base font-semibold leading-tight text-slate-900">
                {addressPreview}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:mt-6 lg:grid-cols-2">
          <article className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-brand-400">
                  <Phone size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Verified Phone
                  </p>
                  <p className="mt-1 truncate text-base font-semibold text-slate-900">
                    {phoneLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Keep your phone up to date for OTP and live order updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-700">
                <ShieldCheck size={13} />
                {portalState.isVerified
                  ? "Phone verified"
                  : "Verification required for checkout"}
              </div>

              <button
                type="button"
                onClick={handleOpenPhoneUpdate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 sm:w-auto"
              >
                <Pencil size={14} />
                {portalState.isVerified ? "Update Phone" : "Verify Phone"}
              </button>
            </div>
          </article>

          <article className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Delivery Address
                </p>
                <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-900">
                  {addressLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This address is used as your default destination during
                  checkout.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
              >
                <Pencil size={14} />
                {portalState.address ? "Update Address" : "Add Address"}
              </button>

              {!portalState.address && (
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 sm:w-auto"
                >
                  Set Delivery Location
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </article>
        </div>

        <article className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600">
              <User size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-slate-900">
                Profile checklist
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {portalState.isVerified && portalState.address
                  ? "You are all set. Your profile details are ready for quick checkout."
                  : "Complete phone verification and save an address for a faster ordering experience."}
              </p>
            </div>
          </div>
        </article>
      </section>

      <BottomNav />
      <CartSidebarWidget />

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
