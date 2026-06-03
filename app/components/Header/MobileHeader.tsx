"use client";

import { LogOut, User,  ClipboardList } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetCustomerAvatarQuery,
  useGetCustomerSalesOrdersQuery,
} from "@/app/redux/api";
import { useLogoutMutation } from "@/app/redux/authApi";
import { CART_UPDATED } from "@/app/lib/cart";
import {
  clearCustomerPortalSession,
  CUSTOMER_PORTAL_UPDATED,
  PHONE_KEY,
  getCustomerName,
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const stableCustomerName = getCustomerName() || portalState.phone;

  const { data: salesOrders } = useGetCustomerSalesOrdersQuery(
    stableCustomerName,
    {
      skip: !portalState.isVerified || !stableCustomerName,
    }
  );

  const { data: customerAvatar } = useGetCustomerAvatarQuery(
    portalState.phone,
    {
      skip: !portalState.isVerified || !portalState.phone,
    }
  );
  const [logout] = useLogoutMutation();

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const hasOrders = portalState.hasOrder || (salesOrders?.length ?? 0) > 0;
  const secondaryText = portalState.isVerified
    ? toWordPreview(portalState.address || "No saved address", 4)
    : "Verify phone to continue";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      setIsProfileOpen((prev) => !prev);
      return;
    }

    setShowPhoneModal(true);
  };

  const handleBellClick = () => {
    setIsProfileOpen(false);

    if (portalState.isVerified) {
      router.push("/my-orders");
      return;
    }

    setShowPhoneModal(true);
  };

  const handleSignOut = async () => {
    const mobile = (portalState.phone || localStorage.getItem(PHONE_KEY) || "").trim();

    try {
      if (mobile) {
        await logout({ mobile }).unwrap();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }

    clearCustomerPortalSession();
    setIsProfileOpen(false);
    refreshPortalState();
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 pt-6">
        <div className="relative min-w-0 flex-1" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleProfileClick}
            className="flex min-w-0 w-full items-center gap-3 text-left"
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

          {portalState.isVerified && isProfileOpen && (
            <div className="absolute left-0 top-15 z-50 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push("/account-profile");
                }}
              >
                <User size={16} />
                Account Profile
              </button>

              <div className="my-1.5 h-px bg-slate-100" />

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-400 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>

      {/* Increased padding (p-2.5) for a better thumb tap target */}
      
      {portalState?.isVerified && (
        <button
          type="button"
          onClick={() => router.push("/my-orders")}
          className="mr-2 flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-90"
        >
          <ClipboardList size={22} />
        </button>
      )}

      
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
