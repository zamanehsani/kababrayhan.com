"use client";
import {
  Search,
  X,
  Home,
  ClipboardList,
  User,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

export default function TabletHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stableCustomerName = getCustomerName() || portalState.phone;

  const navItems = [
    {
      id: "home",
      href: "/home",
      label: "Home",
      icon: <Home size={16} />,
    },
    {
      id: "orders",
      href: "/my-orders",
      label: "Orders",
      icon: <ClipboardList size={16} />,
    },
  ];

  const { data: salesOrders } = useGetCustomerSalesOrdersQuery(
    stableCustomerName,
    {
      skip: !portalState.isVerified || !stableCustomerName,
    }
  );

  const { data: customerAvatar } = useGetCustomerAvatarQuery(
    stableCustomerName,
    {
      skip: !portalState.isVerified || !stableCustomerName,
    }
  );
  const [logout] = useLogoutMutation();

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const hasOrders = portalState.hasOrder || (salesOrders?.length ?? 0) > 0;
  const isHomeRoute =
    pathname === "/" || pathname.startsWith("/home");
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const openVerificationFlowFor = (route: string) => {
    if (portalState.isVerified) {
      router.push(route);
      return;
    }

    setPendingRoute(route);
    setShowPhoneModal(true);
  };

  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);
    const savedPhone =
      phoneJustSaved || globalThis.localStorage.getItem(PHONE_KEY) || "";

    if (savedPhone) {
      setPhoneForVerify(savedPhone);
      setShowVerifyModal(true);
      return;
    }

    setPendingRoute(null);
    refreshPortalState();
  };

  const handleVerifyModalClose = () => {
    setShowVerifyModal(false);
    setPhoneForVerify("");
    refreshPortalState();

    if (pendingRoute) {
      if (readCustomerPortalSnapshot().isVerified) {
        router.push(pendingRoute);
      }

      setPendingRoute(null);
    }
  };

  const handleProfileTrigger = () => {
    if (portalState.isVerified) {
      setIsProfileOpen((prev) => !prev);
      return;
    }

      setShowPhoneModal(true);
  };

  const handleSignOut = async () => {
    const mobile = (portalState.phone || localStorage.getItem(PHONE_KEY) || "").trim();

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

  return (
    <>
      <header className="flex h-24 items-center justify-between border-b border-slate-100 bg-white px-8 transition-all duration-300">
      {/* Left Section: User Profile */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleProfileTrigger}
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-orange-100 bg-slate-50 shadow-sm"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
          >
            {customerAvatar ? (
              <Image
                src={customerAvatar}
                alt="Profile"
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={22} className="text-slate-500" />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute left-0 top-16 z-20 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="mb-1.5 border-b border-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Verified Phone
                </p>
                <p className="truncate text-xs font-medium text-slate-800">
                  {portalState.phone}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {portalState.address || "No saved address"}
                </p>
              </div>

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

        {/* Dynamic Typography Collapse: Subtle fade-out to allocate space */}
        <div
          className={`transition-all duration-300 transform origin-left hidden sm:block ${
            isSearchOpen
              ? "max-w-0 opacity-0 scale-95 pointer-events-none"
              : "max-w-37.5 opacity-100"
          }`}
        >
          <p className="text-xs font-normal uppercase tracking-wider text-slate-400 whitespace-nowrap">
            {portalState.isVerified ? "Welcome Back" : "Welcome"}
          </p>
          <h1 className="text-xl font-normal tracking-wide text-slate-900 whitespace-nowrap">
            {portalState.isVerified ? portalState.phone : "Guest"}
          </h1>
        </div>
      </div>

      {/* Middle Section: Dynamic Navigation Track / Expansible Search Space */}
      <div className="mx-4 flex max-w-xl grow justify-center transition-all duration-300">
        {shouldShowSearchInput ? (
          /* Input Container expands inside the flex-grow area gracefully */
          <div className="relative w-full flex items-center pl-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Search
              size={18}
              className="absolute left-8 text-slate-400 pointer-events-none z-10"
            />
            <input
              type="text"
              autoFocus
              placeholder="Search dishes, orders, tags..."
              value={searchValue}
              onChange={(event) => updateSearchQuery(event.target.value)}
              className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-50 shadow-inner"
            />
          </div>
        ) : (
          <nav className="flex items-center bg-slate-50 p-1 rounded-full border border-slate-100 animate-in fade-in duration-300">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setIsSearchOpen(false);
                  if (item.id === "orders") {
                    openVerificationFlowFor(item.href);
                    return;
                  }

                  router.push(item.href);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  (item.id === "home" && isHomeRoute) ||
                  (item.id === "orders" && pathname.startsWith("/my-orders"))
                    ? "bg-brand-400 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Right Section: Utility Tools Matrix */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={handleSearchToggle}
          className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all active:scale-95 ${
            shouldShowSearchInput
              ? "border-slate-200 bg-slate-50 text-slate-600 rotate-90"
              : "border-slate-100 bg-slate-50 text-slate-600"
          } duration-300`}
        >
          {shouldShowSearchInput ? <X size={20} /> : <Search size={20} />}
        </button>

        <button
          type="button"
          onClick={() => openVerificationFlowFor("/my-orders")}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 shadow-sm transition-all active:scale-95"
        >
          <ClipboardList size={22} />
          {portalState.isVerified && hasOrders && (
            <span className="absolute right-3.25 top-3.25 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
          )}
        </button>
      </div>

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

