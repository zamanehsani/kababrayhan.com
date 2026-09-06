"use client";
import {
  Search,
  X,
  Home,
  User,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useGetCustomerAvatarQuery } from "@/app/redux/api";
import { useLogoutMutation } from "@/app/redux/authApi";
import { useAppSelector } from "@/app/redux/hooks";
import { getCartItemCount, subscribeCart } from "@/app/lib/cart";
import {
  clearCustomerPortalSession,
  CUSTOMER_NAME_KEY,
  getCustomerName,
  getCustomerPortalSnapshot,
  PHONE_KEY,
  SERVER_CUSTOMER_PORTAL_SNAPSHOT,
  subscribeCustomerPortal,
} from "@/app/lib/customerPortal";

export default function TabletHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useAppSelector((state) => state.session);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const portalState = useSyncExternalStore(
    subscribeCustomerPortal,
    getCustomerPortalSnapshot,
    () => SERVER_CUSTOMER_PORTAL_SNAPSHOT
  );

  const cartItemCount = useSyncExternalStore(
    subscribeCart,
    getCartItemCount,
    () => 0
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isVerified =
    portalState.isVerified ||
    (session.phoneStatus === "verified" && Boolean(session.phone)) ||
    (typeof window !== "undefined" &&
      Boolean(
        globalThis.localStorage.getItem(PHONE_KEY) &&
          (globalThis.localStorage.getItem("uae_phone_status") === "verified" ||
            globalThis.localStorage.getItem(CUSTOMER_NAME_KEY) ||
            globalThis.localStorage.getItem("erpnext.customer"))
      ));

  const displayPhone =
    portalState.phone ||
    session.phone ||
    (typeof window !== "undefined"
      ? globalThis.localStorage.getItem(PHONE_KEY) || ""
      : "");

  const stableCustomerName = getCustomerName() || displayPhone;

  const navItems = [
    {
      id: "home",
      href: "/",
      label: "Home",
      icon: <Home size={16} />,
    },
  ];

  const { data: customerAvatar } = useGetCustomerAvatarQuery(
    stableCustomerName,
    {
      skip: !isVerified || !stableCustomerName,
    }
  );
  const [logout] = useLogoutMutation();

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

  const handleProfileTrigger = () => {
    if (isVerified) {
      setIsProfileOpen((prev) => !prev);
      return;
    }

    router.push("/verify");
  };

  const handleTriggerCart = () => {
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
  };

  const handleSignOut = async () => {
    const mobile = (
      displayPhone ||
      (typeof window !== "undefined"
        ? globalThis.localStorage.getItem(PHONE_KEY) || ""
        : "")
    ).trim();

    // Always clear session locally, even if backend logout fails
    clearCustomerPortalSession();
    setIsProfileOpen(false);

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
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-md px-6 select-none transition-all duration-300">
      {/* Left Section: User Profile */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleProfileTrigger}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-red-100 bg-slate-50 shadow-sm"
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
                  {displayPhone}
                </p>
                <p className="w-full truncate text-slate-400">
                  {portalState.address || "View profile & addresses"}
                </p>
              </button>

              <div className="my-1.5 h-px bg-slate-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
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
            {isVerified ? "Welcome Back" : "click to"}
          </p>
          <h1 className="font-normal tracking-wide text-slate-900 whitespace-nowrap">
            {isVerified ? (
              displayPhone
            ) : (
              <span onClick={handleProfileTrigger} className="text-red-600 cursor-pointer">
                Login
              </span>
            )}
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
                  router.push(item.href);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                  item.id === "home" && isHomeRoute
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
  );
}

