"use client";
import {
  Search,
  X,
  Home,
  ClipboardList,
  User,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetCustomerAvatarQuery } from "@/app/redux/api";
import { useLogoutMutation } from "@/app/redux/authApi";
import { CART_UPDATED, getCart, type CartEntry } from "@/app/lib/cart";
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
  const stableCustomerName = getCustomerName() || portalState.phone;

  const navItems = [
    {
      id: "home",
      href: "/",
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

  const isHomeRoute = pathname === "/";
  const searchValue = searchParams.get("search") ?? "";
  const [draftSearchValue, setDraftSearchValue] = useState(searchValue);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldShowSearchInput = isSearchOpen || Boolean(searchValue);

  const cleanupDebounce = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  };

  const applySearchQuery = useCallback(
    (nextValue: string) => {
      const cleanValue = nextValue.trim();
      const nextParams = new URLSearchParams(searchParams.toString());

      if (cleanValue.length >= 2) {
        nextParams.set("search", cleanValue);
      } else {
        nextParams.delete("search");
      }

      const queryString = nextParams.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const updateSearchQuery = (nextValue: string) => {
    const trimmedValue = nextValue;
    setDraftSearchValue(trimmedValue);

    cleanupDebounce();

    if (!trimmedValue.trim()) {
      searchDebounceRef.current = setTimeout(() => applySearchQuery(""), 350);
      return;
    }

    if (trimmedValue.trim().length < 2) {
      return;
    }

    searchDebounceRef.current = setTimeout(
      () => applySearchQuery(trimmedValue),
      450
    );
  };

  const handleSearchToggle = () => {
    if (shouldShowSearchInput) {
      cleanupDebounce();
      setDraftSearchValue("");
      applySearchQuery("");
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

  const handleTriggerCart = () => {
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
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
    router.push("/");
  };

  return (
    <>
      <header className="flex h-24 items-center justify-between border-b border-slate-100 bg-white px-8 transition-all duration-300">
      {/* Left Section: User Profile */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleProfileTrigger}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-1 border-red-100 bg-slate-50 shadow-sm"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
          >
            {customerAvatar ? (
              <Image
                src={customerAvatar}
                alt="Profile"
                width={50}
                height={50}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={25} className="text-slate-500" />
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute left-0 top-16 z-20 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                type="button"
                className="flex w-full flex-col items-start gap-1 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setIsProfileOpen(false);
                  router.push("/account-profile");
                }}
              >
                <p className="w-full truncate font-medium text-slate-800">
                  {portalState.phone}
                </p>
                <p className="w-full truncate text-slate-400">
                  {portalState.address || "No saved address"}
                </p>
              </button>

              <div className="my-1.5 h-px bg-slate-100" />
              <button type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                onClick={handleSignOut} >
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
            {portalState.isVerified ? "Welcome Back" : "click to"}
          </p>
          <h1 className=" font-normal tracking-wide text-slate-900 whitespace-nowrap">
            {portalState.isVerified ? portalState.phone : <span onClick={handleProfileTrigger} className="text-red-600 cursor-pointer">Login</span>}
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
              value={draftSearchValue}
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
                    ? "bg-red-600 text-white shadow-sm"
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
          onClick={handleTriggerCart}
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-600 transition-all active:scale-95 hover:bg-slate-100"
          aria-label={`View shopping bag summary containing ${cartItemCount} items`}
        >
          <UtensilsCrossed size={18} />
          {cartItemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </span>
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

