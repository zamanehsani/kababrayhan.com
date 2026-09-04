"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import DirhamIcon from "../icon/DirhamIcon";
import GlobalLoader from "../home/modal/shared/GlobalLoader";
import { getCart, saveCart, type CartEntry } from "@/app/lib/cart";
import Image from "next/image";

import { readCustomerPortalSnapshot } from "@/app/lib/customerPortal";

export default function CartDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);

  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);
  // Tracks the pathname as of the last render so we can detect a completed
  // route change during render (see the state-adjustment check below).
  const [lastSeenPathname, setLastSeenPathname] = useState(pathname);

  // Once the route actually changes (checkout page mounted, or any page
  // after it), the "Preparing checkout..." loader should clear for good.
  if (pathname !== lastSeenPathname) {
    setLastSeenPathname(pathname);
    if (isNavigatingToCheckout) {
      setIsNavigatingToCheckout(false);
    }
  }

  useEffect(() => {
    const handleOpen = () => {
      setCart(getCart());
      setIsClosing(false);
      setOpen(true);
      setIsNavigatingToCheckout(false); // Reset navigation state when drawer opens
    };
    globalThis.addEventListener("openCartDrawer", handleOpen);
    return () => globalThis.removeEventListener("openCartDrawer", handleOpen);
  }, []);

  const handleClose = () => {
    if (isClosing) return;

    setIsClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 340);
  };

  // Sync body scroll locked state when drawer opens
  useEffect(() => {
    if (open || isClosing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, isClosing]);

  const totalPrice = cart.reduce((sum, entry) => {
    const quantity = entry.qty || 1;
    return sum + (entry.item.discountedPrice || 0) * quantity;
  }, 0);
  const isCartEmpty = cart.length === 0;

  if (!open && !isClosing) {
    return (
      <>
        {isNavigatingToCheckout && (
          <GlobalLoader message="Preparing checkout..." />
        )}
      </>
    );
  }

  const updateCartStorage = (updatedCart: CartEntry[]) => {
    setCart(updatedCart);
    saveCart(updatedCart);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    const updated = cart.filter((_, idx) => idx !== indexToRemove);
    updateCartStorage(updated);
  };

  const handleAdjustQty = (idx: number, amount: number) => {
    const updated = [...cart];
    const target = updated[idx];
    const newQty = (target.qty || 1) + amount;

    if (newQty > 0) {
      target.qty = newQty;
      updateCartStorage(updated);
    }
  };

  const handleBeginCheckout = () => {
    const currentSnapshot = readCustomerPortalSnapshot();

    setOpen(false);
    setIsNavigatingToCheckout(true);
    router.push(currentSnapshot.isVerified ? "/delivery-address" : "/verify");
  };

  return (
    <div className="fixed inset-0 z-300 flex justify-end">
      {/* Backdrop Blur Layer */}
      <button
        type="button"
        aria-label="Close cart drawer"
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm ${
          isClosing ? "animate-cart-fade-out" : "animate-cart-fade-in"
        }`}
        onClick={handleClose}
      />

      {/* Drawer Canvas */}
      <div
        className={`relative z-10 h-dvh w-full max-w-md overflow-hidden bg-white shadow-2xl flex flex-col border-l border-slate-100 ${
          isClosing ? "animate-cart-slide-out" : "animate-cart-slide-in"
        }`}
      >
        {/* Header Segment */}
        <div className="shrink-0 flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold tracking-wide text-slate-900">
              {cart.length} item{cart.length === 1 ? "" : "s"} on your plate
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="min-h-0 basis-0 flex-1 overflow-y-auto bg-slate-50/50 no-scrollbar p-4 flex flex-col gap-3">
          {isCartEmpty ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <ShoppingBag
                size={40}
                className="text-slate-300 stroke-[1.5] mb-2"
              />
              <p className="text-sm font-medium text-slate-400 tracking-wide">
                Your basket is entirely empty.
              </p>
            </div>
          ) : (
            cart.map((entry, idx) => (
              <div
                key={`${entry.item.title}-${entry.addon.title}`}
                className="relative shrink-0 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm transition-all duration-200 hover:border-slate-200/60"
              >
                <div className="flex items-stretch gap-0">
                  <div className="relative h-auto w-[30%] min-w-[92px] overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-b from-white/90 via-white/85 to-white/90 -z-10" />
                    <div className="relative h-full w-full overflow-hidden">
                      <Image
                        src={entry.item.image}
                        alt={entry.item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-between px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold leading-snug tracking-wide text-slate-900">
                          {entry.item.baseTitle || entry.item.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-[11px] font-medium tracking-wide text-slate-600">
                          {entry.item.variationTitle ? (
                            <>
                              <span className="rounded-full bg-red-50 px-2 py-1 text-red-600">
                                {entry.item.variationTitle}
                              </span>
                        
                            </>
                          ) : (<></> )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-0.5 text-lg font-semibold text-slate-900 tracking-wide">
                        <DirhamIcon size={13} className="text-slate-900" />
                        {Math.round(entry.item.discountedPrice * (entry.qty || 1))}
                      </span>

                      <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 p-1">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-100 bg-white text-sm text-slate-600 shadow-sm active:scale-90"
                          onClick={() => handleAdjustQty(idx, -1)}
                        >
                          –
                        </button>
                        <span className="w-4 text-center text-xs font-semibold text-slate-800">
                          {entry.qty || 1}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm text-white shadow-sm active:scale-90"
                          onClick={() => handleAdjustQty(idx, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Interface Panel */}
        <div className="shrink-0 p-5 border-t border-slate-100 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4 text-sm font-semibold text-slate-800 tracking-wide">
            <span>Subtotal Value</span>
            <span className="flex items-center gap-0.5 text-base text-slate-900 font-bold">
              <DirhamIcon size={13} className="text-slate-900" />
              {totalPrice}
            </span>
          </div>

          <button
            onClick={handleBeginCheckout}
            disabled={isCartEmpty}
            className="w-full h-12 rounded-full bg-red-600 text-white font-semibold text-sm tracking-wide shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center relative group"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight
              size={16}
              className="absolute right-6 transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
