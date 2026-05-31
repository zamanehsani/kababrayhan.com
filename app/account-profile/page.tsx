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
  type DeliveryAddressItem,
  PHONE_KEY,
  PHONE_STATUS_KEY,
  dispatchCustomerPortalUpdated,
  initializeCustomerPortalSession,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
  saveVerifiedPhone,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import Footer from "../components/Footer/Footer";

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
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(
    null
  );
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
    if (activeDeliveryIndex === null) return;

    const resolvedAddress = addressData.name || "";
    const addressId = addressData.id;

    const updatedAddresses = portalState.deliveryAddresses.map((da, i) =>
      i === activeDeliveryIndex
        ? { ...da, address: resolvedAddress, addressId }
        : da
    );

    writeDeliveryAddresses(updatedAddresses);

    // Keep primary keys in sync if the first address is updated
    if (activeDeliveryIndex === 0) {
      saveDeliveryAddress(resolvedAddress, addressId);
    }

    refreshPortalState();
    setActiveDeliveryIndex(null);
  };

  const handleAddNewAddress = () => {
    const newAddress: DeliveryAddressItem = {
      id: String(Date.now()),
      title: "",
      address: "",
      addressId: "",
    };
    const updatedAddresses = [...portalState.deliveryAddresses, newAddress];
    writeDeliveryAddresses(updatedAddresses);
    refreshPortalState();
    setActiveDeliveryIndex(updatedAddresses.length - 1);
  };

  const handleRemoveAddress = (indexToRemove: number) => {
    const updatedAddresses = portalState.deliveryAddresses.filter(
      (_, i) => i !== indexToRemove
    );
    writeDeliveryAddresses(updatedAddresses);
    refreshPortalState();
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updatedAddresses = portalState.deliveryAddresses.map((item, i) =>
      i === index ? { ...item, title: newTitle } : item
    );
    writeDeliveryAddresses(updatedAddresses);
    refreshPortalState();
  };

  const phoneLabel =
    portalState.isVerified && portalState.phone
      ? portalState.phone
      : "Not verified yet";
  const primaryAddress =
    portalState.deliveryAddresses[0] ?? portalState.address;
  const addressLabel =
    typeof primaryAddress === "object"
      ? primaryAddress.address
      : primaryAddress;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
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

          <div className="mt-8 flow-root">
            <div className="-my-6 divide-y divide-slate-200">
              {/* -- Verified Phone Section -- */}
              <div className="py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-brand-400">
                      <Phone size={20} />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-slate-900">
                        Verified Phone
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {phoneLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenPhoneUpdate}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-slate-800 sm:w-auto"
                  >
                    <Pencil size={14} />
                    {portalState.isVerified ? "Update" : "Verify"}
                  </button>
                </div>
                {portalState.isVerified && (
                  <div className="mt-4 pl-16 sm:pl-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <ShieldCheck size={14} />
                      <span>Phone is verified</span>
                    </div>
                  </div>
                )}
              </div>

              {/* -- Delivery Addresses Section (Multi-Address Support) -- */}
              <div className="py-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Delivery Addresses
                      </p>
                      <p className="text-xs text-slate-500">
                        Manage your saved locations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address List */}
                <div className="space-y-4">
                  {portalState.deliveryAddresses.length > 0 ? (
                    portalState.deliveryAddresses.map((delivery, index) => (
                      <div
                        key={delivery.id ?? String(index)}
                        className="group rounded-2xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-brand-400/30 hover:shadow-md"
                      >
                        {/* Address Title Row */}
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            Delivery to (
                          </span>
                          <input
                            type="text"
                            value={delivery.title}
                            onChange={(e) =>
                              handleTitleChange(index, e.target.value)
                            }
                            placeholder={index === 0 ? "Home" : "Office, Work…"}
                            className="text-[11px] font-semibold uppercase tracking-wider text-brand-400 bg-transparent border-b border-dashed border-slate-300 focus:border-brand-400 focus:outline-none w-24 text-center placeholder:text-slate-300"
                          />
                          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            )
                          </span>
                          {index === 0 && (
                            <span className="ml-2 rounded-full bg-brand-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Default
                            </span>
                          )}
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAddress(index)}
                              className="ml-auto text-[10px] font-medium uppercase tracking-wide text-slate-400 hover:text-red-500 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Address Content */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-relaxed ${
                                delivery.address
                                  ? "text-slate-700"
                                  : "text-slate-400 italic"
                              }`}
                            >
                              {delivery.address ||
                                "No address selected yet"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveDeliveryIndex(index)}
                            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                              delivery.address
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-brand-400 text-white shadow-lg shadow-red-200 hover:bg-brand-700"
                            }`}
                          >
                            <Pencil size={12} className="inline mr-1.5" />
                            {delivery.address ? "Update" : "Select"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <MapPin
                        size={32}
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-sm text-slate-500">
                        No delivery addresses saved yet
                      </p>
                    </div>
                  )}

                  {/* Add Another Address Button */}
                  <button
                    type="button"
                    onClick={handleAddNewAddress}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-slate-600 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-400"
                  >
                    <span className="text-lg leading-none">+</span>
                    Add Another Address
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      {activeDeliveryIndex !== null && (
        <AddressSelectModal
          open={true}
          onClose={() => setActiveDeliveryIndex(null)}
          onSelect={handleAddressSelect}
          redirectTo={null}
        />
      )}
      <Footer />
    </main>
  );
}
