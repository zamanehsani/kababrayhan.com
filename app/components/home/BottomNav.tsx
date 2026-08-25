"use client";
import { useCallback, useEffect, useState } from "react";
import { Home, ShoppingCart, ClipboardList, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { CART_UPDATED, getCart, type CartEntry } from "@/app/lib/cart";
import {
  CUSTOMER_PORTAL_UPDATED,
  PHONE_KEY,
  PHONE_STATUS_KEY,
  readCustomerPortalSnapshot,
} from "@/app/lib/customerPortal";
import PhoneModal from "./modal/PhoneModal";
import PhoneVerifyModal from "./modal/PhoneVerifyModal";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phoneForVerify, setPhoneForVerify] = useState("");
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [portalState, setPortalState] = useState(() =>
    readCustomerPortalSnapshot()
  );
  const [cartCount, setCartCount] = useState(() => {
    if (globalThis.window === undefined) return 0;
    try {
      const items = getCart() || [];
      return items.reduce((sum: number, e: CartEntry) => sum + (e.qty || 1), 0);
    } catch {
      return 0;
    }
  });

  const refreshPortalState = useCallback(() => {
    setPortalState(readCustomerPortalSnapshot());
  }, []);

  const refreshCartCount = useCallback(() => {
    if (globalThis.window === undefined) return;
    try {
      const items = getCart() || [];
      setCartCount(
        items.reduce((sum: number, e: CartEntry) => sum + (e.qty || 1), 0)
      );
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    globalThis.addEventListener(CUSTOMER_PORTAL_UPDATED, refreshPortalState);
    globalThis.addEventListener(CART_UPDATED, refreshPortalState);
    globalThis.addEventListener("storage", refreshPortalState);
    globalThis.addEventListener(CART_UPDATED, refreshCartCount);
    globalThis.addEventListener("storage", refreshCartCount);

    return () => {
      globalThis.removeEventListener(
        CUSTOMER_PORTAL_UPDATED,
        refreshPortalState
      );
      globalThis.removeEventListener(CART_UPDATED, refreshPortalState);
      globalThis.removeEventListener("storage", refreshPortalState);
      globalThis.removeEventListener(CART_UPDATED, refreshCartCount);
      globalThis.removeEventListener("storage", refreshCartCount);
    };
  }, [refreshPortalState, refreshCartCount]);

  const isHomeRoute = pathname === "/";

  const navItems = [
    { id: "home", icon: <Home size={18} />, active: isHomeRoute },
    {
      id: "cart",
      icon: (
        <span className="relative">
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-1 ring-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </span>
      ),
      active: false,
    },
    {
      id: "orders",
      icon: <ClipboardList size={18} />,
      active: pathname.startsWith("/my-orders"),
    },
    {
      id: "profile",
      icon: <User size={18} />,
      active: pathname.startsWith("/account-profile"),
    },
  ];

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

    if (!savedPhone) {
      setPendingRoute(null);
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

    if (!pendingRoute) {
      return;
    }

    if (readCustomerPortalSnapshot().isVerified) {
      router.push(pendingRoute);
    }

    setPendingRoute(null);
  };

  const handleChangePhoneFromVerify = () => {
    setShowVerifyModal(false);
    setPhoneForVerify("");
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(PHONE_STATUS_KEY);
    setShowPhoneModal(true);
  };

  const handleAction = (id: string) => {
    if (id === "home") {
      router.push("/");
      return;
    }

    if (id === "cart") {
      // Dispatches global event to open your newly built Next.js CartDrawer.
      globalThis.dispatchEvent(new Event("openCartDrawer"));
      return;
    }

    if (id === "orders") {
      openVerificationFlowFor("/my-orders");
      return;
    }

    if (id === "profile") {
      openVerificationFlowFor("/account-profile");
    }
  };

  return (
    <>
      <nav className="fixed bottom-2 left-1/2 z-100 -translate-x-1/2 md:hidden">
        <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-400/20 p-1.5 backdrop-blur-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleAction(item.id)}
              aria-label={item.id}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                item.active
                  ? "scale-105 bg-red-600 text-white shadow-sm"
                  : "bg-white text-slate-500 shadow-sm hover:bg-slate-50 active:scale-95"
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </nav>

      {showPhoneModal && (
        <PhoneModal
          open={showPhoneModal}
          allowExistingPhone={true}
          onClose={handlePhoneModalClose}
        />
      )}
      {showVerifyModal && (
        <PhoneVerifyModal
          open={showVerifyModal}
          phone={phoneForVerify}
          onClose={handleVerifyModalClose}
          onChangePhone={handleChangePhoneFromVerify}
        />
      )}
    </>
  );
}
