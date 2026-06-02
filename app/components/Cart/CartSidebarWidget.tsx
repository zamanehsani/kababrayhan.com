"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import CartDrawer from "../Drawer/CartDrawer";
import { getCart, CART_UPDATED, type CartEntry } from "@/app/lib/cart";

export default function CartSidebarWidget() {
  const [itemCount, setItemCount] = useState(0);

  const refreshCartBadge = useCallback(() => {
    if (typeof window === "undefined") return;
    
    try {
      const items = getCart() || [];
      const totalItems = items.reduce(
        (sum: number, entry: CartEntry) => sum + (entry.qty || 1),
        0
      );
      setItemCount(totalItems);
    } catch (error) {
      console.error("Failed to parse cart values safely:", error);
      setItemCount(0);
    }
  }, []);

  useEffect(() => {
    refreshCartBadge();

    window.addEventListener(CART_UPDATED, refreshCartBadge);
    window.addEventListener("storage", refreshCartBadge);
    window.addEventListener("openCartDrawer", refreshCartBadge);

    return () => {
      window.removeEventListener(CART_UPDATED, refreshCartBadge);
      window.removeEventListener("storage", refreshCartBadge);
      window.removeEventListener("openCartDrawer", refreshCartBadge);
    };
  }, [refreshCartBadge]);

  const handleTriggerCart = () => {
    window.dispatchEvent(new CustomEvent("openCartDrawer"));
  };

  return (
    <>
      {/* 
        Responsive Target Layer:
        - `hidden`: Hidden by default on all screens under 768px (< md)
        - `md:flex`: Becomes visible as a flex container from 768px and up
      */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-[200]">
        <button
          onClick={handleTriggerCart}
          className="flex flex-col items-center justify-center w-14 h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-l-2xl shadow-2xl border-y border-l border-slate-800 transition-all active:scale-95 group relative"
          aria-label={`View shopping bag summary containing ${itemCount} items`}
        >
          <div className="relative p-1">
            <ShoppingCart
              size={20}
              className="text-brand-400 group-hover:scale-105 transition-transform"
            />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-slate-900 animate-scale-up">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-slate-300 mt-1 uppercase">
            Cart
          </span>
        </button>
      </div>

      {/* Global Overlays Drawer Workspace Canvas Element */}
      <CartDrawer />
    </>
  );
}
