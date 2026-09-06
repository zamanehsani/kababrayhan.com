"use client";
import { useSyncExternalStore } from "react";
import { Home, ShoppingCart, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux/hooks";
import { getCartItemCount, subscribeCart } from "@/app/lib/cart";
import {
  CUSTOMER_NAME_KEY,
  getCustomerPortalSnapshot,
  PHONE_KEY,
  SERVER_CUSTOMER_PORTAL_SNAPSHOT,
  subscribeCustomerPortal,
} from "@/app/lib/customerPortal";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppSelector((state) => state.session);

  const portalState = useSyncExternalStore(
    subscribeCustomerPortal,
    getCustomerPortalSnapshot,
    () => SERVER_CUSTOMER_PORTAL_SNAPSHOT
  );

  const cartCount = useSyncExternalStore(
    subscribeCart,
    getCartItemCount,
    () => 0
  );

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
      id: "profile",
      icon: <User size={18} />,
      active: pathname.startsWith("/account-profile"),
    },
  ];

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

    if (id === "profile") {
      if (isVerified) {
        router.push("/account-profile");
      } else {
        router.push("/verify");
      }
    }
  };

  return (
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
  );
}
