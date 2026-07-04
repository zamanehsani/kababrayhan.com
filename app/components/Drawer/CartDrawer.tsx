"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import DirhamIcon from "../icon/DirhamIcon";
import PhoneModal from "../home/modal/PhoneModal";
import PhoneVerifyModal from "../home/modal/PhoneVerifyModal";
import DeliveryTakeawayModal from "../home/modal/DeliveryTakeawayModal";
import AddressSelectModal from "../home/modal/AddressSelectModal";
import UpdateDecisionModal from "../home/modal/UpdateDecisionModal";
import GlobalLoader from "../home/modal/shared/GlobalLoader";
import { getCart, saveCart, type CartEntry } from "@/app/lib/cart";
import {
  PHONE_KEY,
  PHONE_STATUS_KEY,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
} from "@/app/lib/customerPortal";
import SavedAddressesModal from "../home/modal/SavedAddressesModal";
import { useUpdateAddressMutation } from "@/app/redux/api";

export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);

  // Modal Orchestration State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phone, setPhone] = useState("");
  // const [address, setAddress] = useState("");
  const [showDeliveryTakeaway, setShowDeliveryTakeaway] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPhoneUpdatePrompt, setShowPhoneUpdatePrompt] = useState(false);
  // const [showAddressUpdatePrompt, setShowAddressUpdatePrompt] = useState(false);
  const [allowExistingPhoneInput, setAllowExistingPhoneInput] = useState(false);
  const [showSavedAddressesModal, setShowSavedAddressesModal] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  const [snapshot, setSnapshot] = useState(readCustomerPortalSnapshot());
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<
    string | undefined
  >(snapshot.addressId);

  const [updateAddress] = useUpdateAddressMutation();

  useEffect(() => {
    const handleOpen = () => {
      setCart(getCart());
      setOpen(true);
      setIsNavigatingToCheckout(false); // Reset navigation state when drawer opens
    };
    globalThis.addEventListener("openCartDrawer", handleOpen);
    return () => globalThis.removeEventListener("openCartDrawer", handleOpen);
  }, []);

  // Sync body scroll locked state when drawer opens
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const totalPrice = cart.reduce(
    (sum, entry) => sum + (entry.item.discountedPrice || 0) * (entry.qty || 1),
    0
  );

  if (!open) {
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
    const snapshot = readCustomerPortalSnapshot();

    if (snapshot.isVerified && snapshot.phone) {
      setPhone(snapshot.phone);
      setShowPhoneUpdatePrompt(true);
      return;
    }

    if (snapshot.phoneStatus === "entered" && snapshot.phone) {
      setPhone(snapshot.phone);
      setShowVerifyModal(true);
      return;
    }

    setAllowExistingPhoneInput(false);
    setShowPhoneModal(true);
  };

  const proceedAfterPhoneDecision = () => {
    setShowDeliveryTakeaway(true);
  };

  const handlePhoneUpdateConfirm = () => {
    setShowPhoneUpdatePrompt(false);
    setAllowExistingPhoneInput(true);
    setShowPhoneModal(true);
  };

  const handlePhoneUpdateSkip = () => {
    setShowPhoneUpdatePrompt(false);
    proceedAfterPhoneDecision();
  };


  const handlePhoneModalClose = (phoneJustSaved?: string) => {
    setShowPhoneModal(false);

    // If there is no phone just saved (user clicked X / cancelled close)
    if (!phoneJustSaved) {
      setAllowExistingPhoneInput(false);
      // Stop execution here so it stays on the open CartDrawer 
      // instead of moving forward to the delivery modals.
      return;
    }

    const savedPhone = phoneJustSaved || localStorage.getItem(PHONE_KEY) || "";
    const status = localStorage.getItem(PHONE_STATUS_KEY);

    if (!savedPhone) {
      setAllowExistingPhoneInput(false);
      return;
    }

    setPhone(savedPhone);

    // If user was in explicit update flow and completed changing it,
    // continue checkout with existing verified session.
    if (allowExistingPhoneInput && status === "verified") {
      setAllowExistingPhoneInput(false);
      proceedAfterPhoneDecision();
      return;
    }

    setAllowExistingPhoneInput(false);
    setShowVerifyModal(true);
  };

  const handleDeliverySelection = (option: "delivery" | "takeaway") => {
    setShowDeliveryTakeaway(false);

    globalThis.localStorage?.setItem("order_type", option);
    
    if (option !== "delivery") {
      setOpen(false);
      setIsNavigatingToCheckout(true);
      router.push("/checkout");
      return;
    }

    const snapshot = readCustomerPortalSnapshot();

    const addresses = snapshot.deliveryAddresses;


    if (addresses.length > 0) {
      setShowSavedAddressesModal(true);
      return;
    }

    setShowAddressModal(true);
  };

  return (
    <div className="fixed inset-0 z-300 flex justify-end">
      {/* Backdrop Blur Layer */}
      <button
        type="button"
        aria-label="Close cart drawer"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Drawer Canvas */}
      <div className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-100 animate-slide-in">
        {/* Header Segment */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-red-500" />
            <h2 className="text-lg font-semibold tracking-wide text-slate-900">
              {cart.length} item{cart.length === 1 ? "" : "s"} selected
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-full border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Items Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 no-scrollbar p-4 flex flex-col gap-3">
          {cart.length === 0 ? (
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
                key={`${entry.item.id}-${idx}`}
                className="bg-white rounded-2xl border border-slate-100/80 p-4 relative shadow-sm group transition-all duration-200 hover:border-slate-200/60"
              >
                {/* Discrete Delete Callout */}
                <button
                  onClick={() => handleRemoveItem(idx)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>

                <div className="flex gap-4">
                  {/* Image Core */}
                  <div className="w-16 h-16 relative bg-slate-50 rounded-xl p-1 shrink-0 flex items-center justify-center">
                    <img
                      src={entry.item.image}
                      alt={entry.item.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Metadata Matrix */}
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-base text-slate-900 leading-tight tracking-wide mb-0.5">
                      {entry.item.title}
                    </h3>

                    {/* Addon Bracket */}
                    <div className="inline-flex flex-col">
                      <p className="text-xs font-semibold text-slate-700 tracking-wide">
                        {entry.addon.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {entry.addon.description || "Standard portion"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subfooter Actions Grid */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5">
                    <span className="flex items-center gap-0.5 text-lg font-semibold text-slate-900 tracking-wide">
                      <DirhamIcon size={13} className="text-slate-900" />
                      {Math.round(
                        entry.item.discountedPrice * (entry.qty || 1)
                      )}
                    </span>
                    {/* <span className="flex items-center gap-0.5 text-xs text-slate-400 line-through font-medium">
                      <DirhamIcon size={10} className="text-slate-400" />
                      {Math.round(entry.item.realPrice * (entry.qty || 1))}
                    </span> */}
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Compact Quantity Regulator */}
                    <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100 gap-2">
                      <button
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-slate-600 border border-slate-100 shadow-sm active:scale-90 text-sm"
                        onClick={() => handleAdjustQty(idx, -1)}
                      >
                        –
                      </button>
                      <span className="text-xs font-semibold text-slate-800 w-4 text-center">
                        {entry.qty || 1}
                      </span>
                      <button
                        className="w-6 h-6 flex items-center justify-center bg-red-600 rounded-full text-white shadow-sm active:scale-90 text-sm"
                        onClick={() => handleAdjustQty(idx, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Interface Panel */}
        <div className="p-5 border-t border-slate-100 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4 text-sm font-semibold text-slate-800 tracking-wide">
            <span>Subtotal Value</span>
            <span className="flex items-center gap-0.5 text-base text-slate-900 font-bold">
              <DirhamIcon size={13} className="text-slate-900" />
              {totalPrice}
            </span>
          </div>

          <button
            onClick={handleBeginCheckout}
            disabled={cart.length === 0}
            className="w-full h-12 rounded-full bg-red-600 text-white font-semibold text-sm tracking-wide shadow-lg shadow-slate-900/10 hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center relative group"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight
              size={16}
              className="absolute right-6 transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>

        {/* External Modal Mount Tracks */}
        {showPhoneModal && (
          <PhoneModal
            open={showPhoneModal}
            allowExistingPhone={allowExistingPhoneInput}
            onClose={handlePhoneModalClose}
          />
        )}
        {showVerifyModal && (
          <PhoneVerifyModal
            open={showVerifyModal}
            phone={phone}
            onClose={() => {
              setShowVerifyModal(false);
              proceedAfterPhoneDecision();
            }}
          />
        )}
        {showDeliveryTakeaway && (
          <DeliveryTakeawayModal
            open={showDeliveryTakeaway}
            onClose={() => setShowDeliveryTakeaway(false)}
            onSelect={handleDeliverySelection}
          />
        )}
        {showAddressModal && (
          <AddressSelectModal
            open={showAddressModal}
            redirectTo={null}
            onClose={() => {
              setShowAddressModal(false);
            }}
            onSelect={(newAddress) => {
              setShowAddressModal(false);

              const updatedSnapshot = readCustomerPortalSnapshot();

              setSnapshot(updatedSnapshot);

              setSelectedDeliveryAddressId(newAddress.id);

              setShowSavedAddressesModal(true);
            }}
          />
        )}
        <UpdateDecisionModal
          open={showPhoneUpdatePrompt}
          title="Phone number"
          description="We found a phone number on your account. Use it to continue, or change it before checkout."
          detail={phone}
          confirmLabel="Change Number"
          skipLabel="Use This Number"
          onConfirm={handlePhoneUpdateConfirm}
          onSkip={handlePhoneUpdateSkip}
        />
        <SavedAddressesModal
          open={showSavedAddressesModal}
          addresses={snapshot.deliveryAddresses}
          selectedAddressId={selectedDeliveryAddressId}
          onSelect={async (selected) => {
            try {
              // Update ERPNext native shipping address
              await updateAddress({
                addressName: selected.addressId,
                is_shipping_address: 1,
              }).unwrap();

              // Persist local snapshot
              saveDeliveryAddress(selected.address, selected.addressId);

              // Update UI state
              setSelectedDeliveryAddressId(selected.addressId);

              // Refresh local snapshot
              const updatedSnapshot = readCustomerPortalSnapshot();
              setSnapshot(updatedSnapshot);
            } catch (error) {
              console.error("Failed to update delivery address", error);
            }
          }}
          onAddNew={() => {
            setShowSavedAddressesModal(false);
            setShowAddressModal(true);
          }}
          onClose={() => {
            setShowSavedAddressesModal(false);
          }}
          onContinue={() => {
            setShowSavedAddressesModal(false);
            setOpen(false);
            setIsNavigatingToCheckout(true);
            router.push("/checkout");
          }}
        />
      </div>
    </div>
  );
}
