"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import DirhamIcon from "../icon/DirhamIcon";
import PhoneModal from "../home/modal/PhoneModal";
import PhoneVerifyModal from "../home/modal/PhoneVerifyModal";
import AddressSelectModal from "../home/modal/AddressSelectModal";
import UpdateDecisionModal from "../home/modal/UpdateDecisionModal";
import GlobalLoader from "../home/modal/shared/GlobalLoader";
import { getCart, saveCart, type CartEntry } from "@/app/lib/cart";
import Image from "next/image";

import {
  PHONE_KEY,
  PHONE_STATUS_KEY,
  getCustomerName,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
  type DeliveryAddressItem,
} from "@/app/lib/customerPortal";
import type { Address } from "@/app/redux/apiType";
import SavedAddressesModal from "../home/modal/SavedAddressesModal";
import {
  useGetCustomerAddressesQuery,
  useUpdateAddressMutation,
} from "@/app/redux/api";

export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);

  // Modal Orchestration State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [phone, setPhone] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPhoneUpdatePrompt, setShowPhoneUpdatePrompt] = useState(false);
  const [allowExistingPhoneInput, setAllowExistingPhoneInput] = useState(false);
  const [showSavedAddressesModal, setShowSavedAddressesModal] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);

  const [snapshot, setSnapshot] = useState(() => readCustomerPortalSnapshot());
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<
    string | undefined
  >(() => readCustomerPortalSnapshot().addressId);

  const customerName = getCustomerName() || snapshot.phone || phone;
  const { data: backendAddresses, refetch: refetchSavedAddresses } =
    useGetCustomerAddressesQuery(customerName, {
      skip: !customerName,
    });

  const resolvedSavedAddresses: DeliveryAddressItem[] =
    snapshot.deliveryAddresses.length > 0
      ? snapshot.deliveryAddresses
      : (backendAddresses ?? [])
          .map((address: Address): DeliveryAddressItem => ({
            title:
              address.address_title ||
              address.address_type ||
              "Saved Address",
            address: [address.address_line1, address.address_line2]
              .filter(Boolean)
              .join(", "),
            addressId: address.name,
          }))
          .filter(
            (address) => Boolean(address.address) || Boolean(address.addressId)
          );

  const [updateAddress] = useUpdateAddressMutation();

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

    if (currentSnapshot.isVerified && currentSnapshot.phone) {
      setPhone(currentSnapshot.phone);
      setShowPhoneUpdatePrompt(true);
      return;
    }

    if (currentSnapshot.phoneStatus === "entered" && currentSnapshot.phone) {
      setPhone(currentSnapshot.phone);
      setShowVerifyModal(true);
      return;
    }

    setAllowExistingPhoneInput(false);
    setShowPhoneModal(true);
  };

  const proceedToDeliveryFlow = async () => {
    const currentSnapshot = readCustomerPortalSnapshot();
    const localAddresses = currentSnapshot.deliveryAddresses;

    if (localAddresses.length > 0) {
      setShowSavedAddressesModal(true);
      return;
    }

    const customerNameToUse = getCustomerName() || currentSnapshot.phone || phone;
    if (customerNameToUse) {
      try {
        const refreshed = await refetchSavedAddresses();
        const remoteAddresses = refreshed.data ?? backendAddresses ?? [];

        if (Array.isArray(remoteAddresses) && remoteAddresses.length > 0) {
          setShowSavedAddressesModal(true);
          return;
        }
      } catch {
        // fall through to map selection when no saved addresses are available
      }
    }

    setShowAddressModal(true);
  };

  const handlePhoneUpdateConfirm = () => {
    setShowPhoneUpdatePrompt(false);
    setAllowExistingPhoneInput(true);
    setShowPhoneModal(true);
  };

  const handlePhoneUpdateSkip = () => {
    setShowPhoneUpdatePrompt(false);
    void proceedToDeliveryFlow();
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
      void proceedToDeliveryFlow();
      return;
    }

    setAllowExistingPhoneInput(false);
    setShowVerifyModal(true);
  };

  const handleVerifyModalClose = (didVerify?: boolean) => {
    setShowVerifyModal(false);

    if (didVerify) {
      void proceedToDeliveryFlow();
      return;
    }
  };

  const handleChangePhoneFromVerify = () => {
    setShowVerifyModal(false);
    setAllowExistingPhoneInput(true);
    setShowPhoneModal(true);
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
        className={`relative z-10 w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-100 ${
          isClosing ? "animate-cart-slide-out" : "animate-cart-slide-in"
        }`}
      >
        {/* Header Segment */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
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
        <div className="flex-1 overflow-y-auto bg-slate-50/50 no-scrollbar p-4 flex flex-col gap-3">
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
                className="relative overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm transition-all duration-200 hover:border-slate-200/60"
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

        {/* External Modal Mount Tracks */}
        {showPhoneModal && (
          <PhoneModal
            open={showPhoneModal}
            allowExistingPhone={allowExistingPhoneInput}
            initialPhone={phone}
            onClose={handlePhoneModalClose}
          />
        )}
        {showVerifyModal && (
          <PhoneVerifyModal
            open={showVerifyModal}
            phone={phone}
            onClose={handleVerifyModalClose}
            onChangePhone={handleChangePhoneFromVerify}
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
        {showPhoneUpdatePrompt && (
          <UpdateDecisionModal
            open={showPhoneUpdatePrompt}
            title="Phone number"
            description="We found a phone number on your account. Use it to continue, or change it before checkout."
            detail={phone}
            confirmLabel="Change Number"
            skipLabel="Continue"
            onConfirm={handlePhoneUpdateConfirm}
            onSkip={handlePhoneUpdateSkip}
          />
        )}
        <SavedAddressesModal
          open={showSavedAddressesModal}
          addresses={resolvedSavedAddresses}
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
