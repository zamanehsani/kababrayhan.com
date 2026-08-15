"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StickyNote,
  Search,
  ChevronDown,
  Home,
  User,
  LogOut,
  X,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLogoutMutation } from "@/app/redux/authApi";
import { CART_UPDATED, getCart, type CartEntry } from "@/app/lib/cart";
import {
  clearCustomerPortalSession,
  CUSTOMER_PORTAL_UPDATED,
  PHONE_KEY,
  readCustomerPortalSnapshot,
} from "@/app/lib/customerPortal";
import PhoneModal from "../home/modal/PhoneModal";
import PhoneVerifyModal from "../home/modal/PhoneVerifyModal";
 

export default function DesktopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [cartItemCount, setCartItemCount] = useState(() => {
    if (typeof window === "undefined") return 0;

    try {
      const items = getCart() || [];
      return items.reduce(
        (sum: number, entry: CartEntry) => sum + (entry.qty || 1),
        0
      );
    } catch (error) {
      console.error("Failed to parse cart values safely:", error);
      return 0;
    }
  });
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const desktopNavItems = [
    { id: "home", href: "/home", label: "Home", icon: <Home size={16} /> },
    { id: "orders", href: "/my-orders", label: "My Orders", icon: <StickyNote size={16} /> },
  ];

  const [logout] = useLogoutMutation();

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const refreshCartBadge = useCallback(() => {
    if (typeof window === "undefined") {
      setCartItemCount(0);
      return;
    }

    try {
      const items = getCart() || [];
      const nextCount = items.reduce(
        (sum: number, entry: CartEntry) => sum + (entry.qty || 1),
        0
      );
      setCartItemCount(nextCount);
    } catch (error) {
      console.error("Failed to parse cart values safely:", error);
      setCartItemCount(0);
    }
  }, []);

  const shouldShowNav = portalState.isVerified;
  const isHomeRoute = pathname === "/" || pathname.startsWith("/home");
  const searchValue = searchParams.get("search") ?? "";
  const shouldShowSearchInput = isSearchOpen || Boolean(searchValue);

  const updateSearchQuery = (nextValue: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextValue.trim()) {
      nextParams.set("search", nextValue);
    } else {
      nextParams.delete("search");
    }

    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const handleSearchToggle = () => {
    if (shouldShowSearchInput) {
      updateSearchQuery("");
      setIsSearchOpen(false);
      return;
    }

    setIsSearchOpen(true);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener(CART_UPDATED, refreshCartBadge);
    globalThis.addEventListener("storage", refreshPortalState);
    globalThis.addEventListener("storage", refreshCartBadge);
    globalThis.addEventListener("openCartDrawer", refreshCartBadge);

    return () => {
      globalThis.removeEventListener(
        CUSTOMER_PORTAL_UPDATED,
        refreshPortalState
      );
      globalThis.removeEventListener(CART_UPDATED, refreshCartBadge);
      globalThis.removeEventListener("storage", refreshPortalState);
      globalThis.removeEventListener("storage", refreshCartBadge);
      globalThis.removeEventListener("openCartDrawer", refreshCartBadge);
    };
  }, [refreshCartBadge, refreshPortalState]);

  const handlePortalClick = () => {
    setShowPhoneModal(true);
  };

  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);
    const savedPhone = phoneJustSaved || localStorage.getItem(PHONE_KEY) || "";

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

  const handleTriggerCart = () => {
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
  };

  const handleSignOut = async () => {
    const mobile = (
      portalState.phone ||
      phoneForVerify ||
      localStorage.getItem(PHONE_KEY) ||
      ""
    ).trim();

    // Always clear session locally, even if backend logout fails
    clearCustomerPortalSession();
    setIsProfileOpen(false);
    refreshPortalState();

    try {
      if (mobile) {
        await logout({ mobile }).unwrap();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }

    // Always redirect to home after logout
    router.push("/home");
  };

  let middleSectionContent: React.ReactNode = <div className="h-9 w-full" />;

  if (shouldShowSearchInput) {
    middleSectionContent = (
      <div className="relative w-full flex items-center animate-in fade-in slide-in-from-top-1 duration-300">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
          <Search size={16} />
        </span>
        <input
          type="text"
          autoFocus
          placeholder="Search anything"
          value={searchValue}
          onChange={(event) => updateSearchQuery(event.target.value)}
          className="w-full h-12 pl-10 pr-3.5 rounded-full border border-slate-200 bg-slate-50 text-[13px] font-medium text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100 shadow-inner"
        />
      </div>
    );
  } else if (shouldShowNav) {
    middleSectionContent = (
      <nav className="flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
        {desktopNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setIsSearchOpen(false);
              router.push(item.href);
            }}
            className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-200 ${
              (item.href === "/home" && isHomeRoute) ||
              (item.href !== "/home" && pathname.startsWith(item.href))
                ? "bg-red-600 text-white shadow-sm scale-100"
                : "text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white px-12 select-none transition-all duration-300">
      {/* Left Section: Image Branding */}
      <div className="flex items-center shrink-0">
        <Link href="/home" className="cursor-pointer">
          <Image
            src="/logo.png"
            alt="Kabab Rayhan"
            width={150}
            height={44}
            className="h-18 w-auto object-contain"
            priority
          />
        </Link>
        <h1 className="text-lg font-bold text-slate-900 ml-3 leading-tight">Kabab AlRayhan <br /> 
          <span className="text-sm text-slate-500 font-normal">Restaurant & Bakery</span>
        </h1>
      </div>

      {/* Middle Section: Centered Navigation Track & Takeover Search Space */}
      <div className="grow flex justify-center items-center mx-6 max-w-xl transition-all duration-300">
        {middleSectionContent}
      </div>

      {/* Right Section: Alerts, Search Toggle, & Identity Dropdown */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Dynamic Search Toggle Trigger */}
        <button 
          onClick={handleSearchToggle}
          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all active:scale-95 duration-200 ${
            shouldShowSearchInput
              ? "border-slate-200 bg-slate-50 text-slate-600 rotate-90"
              : "border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {shouldShowSearchInput ? <X size={18} /> : <Search size={18} />}
        </button>

       
        {portalState.isVerified ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 group ${
                isProfileOpen
                  ? "border-red-200 bg-orange-50/40"
                  : "border-slate-200/80 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                <User size={16} />
              </div>

              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${
                  isProfileOpen ? "rotate-180 text-orange-600" : ""
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-13 z-50 w-64 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2.5 mb-1.5 border-b border-slate-50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verified Phone
                  </p>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {portalState.phone}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {portalState.address || "No saved address"}
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/account-profile");
                  }}
                >
                  <User size={16} className="text-slate-400" />
                  <span>Account Profile</span>
                </button>

                <div className="h-px bg-slate-100 my-1.5" />

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleSignOut}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePortalClick}
            className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
          >
            Account
          </button>
        )}

        <button
          type="button"
          onClick={handleTriggerCart}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
          aria-label={`View shopping bag summary containing ${cartItemCount} items`}
        >
          <UtensilsCrossed size={18} />
          {cartItemCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </span>
          )}
        </button>
      </div>

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
    </header>
  );
}

