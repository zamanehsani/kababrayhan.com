"use client";

import { Bell, User } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetCustomerAvatarQuery,
  useGetCustomerSalesOrdersQuery,
} from "@/app/redux/api";
import { CART_UPDATED } from "@/app/lib/cart";
import {
  CUSTOMER_PORTAL_UPDATED,
  PHONE_KEY,
  readCustomerPortalSnapshot,
} from "@/app/lib/customerPortal";
import PhoneModal from "../home/modal/PhoneModal";
import PhoneVerifyModal from "../home/modal/PhoneVerifyModal";

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

export default function MobileHeader() {
  const router = useRouter();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );

  const { data: salesOrders } = useGetCustomerSalesOrdersQuery(
    portalState.phone,
    {
      skip: !portalState.isVerified || !portalState.phone,
    }
  );

  const { data: customerAvatar } = useGetCustomerAvatarQuery(
    portalState.phone,
    {
      skip: !portalState.isVerified || !portalState.phone,
    }
  );

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const hasOrders = portalState.hasOrder || (salesOrders?.length ?? 0) > 0;
  const secondaryText = portalState.isVerified
    ? toWordPreview(portalState.address || "No saved address", 4)
    : "Verify phone to continue";

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener(CART_UPDATED, refreshPortalState);
    globalThis.addEventListener("storage", refreshPortalState);

    return () => {
      globalThis.removeEventListener(
        CUSTOMER_PORTAL_UPDATED,
        refreshPortalState
      );
      globalThis.removeEventListener(CART_UPDATED, refreshPortalState);
      globalThis.removeEventListener("storage", refreshPortalState);
    };
  }, [refreshPortalState]);

  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);
    const savedPhone =
      phoneJustSaved || globalThis.localStorage.getItem(PHONE_KEY) || "";

    if (!savedPhone) {
      refreshPortalState();
      return;
    }

    setPhoneForVerify(savedPhone);
    setShowVerifyModal(true);
  };

  const handleVerifyModalClose = () => {
    setShowVerifyModal(false);
    setPhoneForVerify("");
    refreshPortalState();
  };

  const handleProfileClick = () => {
    if (portalState.isVerified) {
      router.push("/account-profile");
      return;
    }

    setShowPhoneModal(true);
  };

  const handleBellClick = () => {
    if (portalState.isVerified) {
      router.push("/my-orders");
      return;
    }

    setShowPhoneModal(true);
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-6">
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
        {/* Profile Image - Kept at 48px, perfect for mobile */}
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-orange-100 bg-slate-50 shadow-sm">
          {customerAvatar ? (
            <Image
              src={customerAvatar}
              alt="Profile"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={20} className="text-slate-500" />
          )}
        </div>

        <div className="min-w-0">
          {/* Increased weight for better recognition */}
          <h1 className="truncate text-[17px] font-semibold tracking-wide text-slate-900">
            {portalState.isVerified ? portalState.phone : "Guest"}
          </h1>
          {/* Bumped to text-sm (14px) for readability; slate-500 is the standard for secondary info */}
          <p className="truncate text-sm font-normal text-slate-500">
            {secondaryText}
          </p>
        </div>
        </button>

      {/* Increased padding (p-2.5) for a better thumb tap target */}
      <button
        type="button"
        onClick={handleBellClick}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-90"
      >
        <Bell size={22} />
        {/* Notification Dot - positioned slightly better for visibility */}
        {portalState.isVerified && hasOrders && (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
        )}
      </button>
      </header>

      {showPhoneModal && (
        <PhoneModal open={showPhoneModal} onClose={handlePhoneModalClose} />
      )}
      {showVerifyModal && (
        <PhoneVerifyModal
          open={showVerifyModal}
          phone={phoneForVerify}
          onClose={handleVerifyModalClose}
        />
      )}
    </>
  );
}
