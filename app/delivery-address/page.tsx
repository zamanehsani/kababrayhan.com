"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MapPin, Plus } from "lucide-react";

import { readStoredCustomerProfile } from "@/app/components/customerStorage";
import { toDeliveryAddressItem } from "@/app/lib/customerAccount";
import { validateDeliveryZone } from "@/app/lib/geocoding";
import type { DeliveryAddressItem } from "@/app/lib/customerPortal";
import {
  getCustomerName,
  readCustomerPortalSnapshot,
  saveDeliveryAddress,
} from "@/app/lib/customerPortal";
import {
  useGetCustomerAddressesQuery,
  useUpdateAddressMutation,
} from "@/app/redux/api";

export default function DeliveryAddressPage() {
  const router = useRouter();
  const [customerName] = useState(() => getCustomerName());
  const [selectedAddressId, setSelectedAddressId] = useState(
    () => readCustomerPortalSnapshot().addressId
  );
  const [error, setError] = useState("");
  const [cachedAddresses] = useState(
    () => readStoredCustomerProfile()?.addresses ?? []
  );

  const {
    data: addresses,
    isLoading,
    isError,
  } = useGetCustomerAddressesQuery(customerName, { skip: !customerName });

  const [updateAddress, { isLoading: isSavingAddress }] =
    useUpdateAddressMutation();

  useEffect(() => {
    if (!readCustomerPortalSnapshot().isVerified) {
      router.replace("/verify");
    }
  }, [router]);

  const items = (addresses ?? cachedAddresses).map(toDeliveryAddressItem);

  const handleSelect = async (item: DeliveryAddressItem) => {
    setSelectedAddressId(item.addressId);
    setError("");

    try {
      await updateAddress({
        addressName: item.addressId,
        is_shipping_address: 1,
      }).unwrap();
      saveDeliveryAddress(item.address, item.addressId);

      const lat = Number(item.latitude);
      const lng = Number(item.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const zone = await validateDeliveryZone(lat, lng);
        globalThis.localStorage?.setItem("uae_delivery_zone", zone.zoneName);
        globalThis.localStorage?.setItem(
          "uae_delivery_charge",
          String(zone.deliveryCharge)
        );
      }
    } catch (selectError) {
      console.error("Failed to set delivery address", selectError);
      setError("We couldn't save that address. Please try again.");
    }
  };

  const handleContinue = () => {
    if (!selectedAddressId) {
      setError("Select a delivery address to continue.");
      return;
    }

    router.push("/checkout");
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 p-4 sm:p-6">
      <div className="w-full max-w-xl text-center p-5 sm:p-6 ">
        <h1 className="text-lg sm:text-xl  font-semibold tracking-wide text-slate-900">
          Delivery address
        </h1>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
          Choose where we should deliver your order.
        </p>

        <div className="mt-4 flex max-h-[52vh] flex-col gap-2.5 overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs sm:text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Loading your addresses...
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs sm:text-sm text-slate-500">
              No saved addresses yet. Add one to continue.
            </p>
          )}

          {items.map((item) => {
            const isSelected = item.addressId === selectedAddressId;

            return (
             <button
                key={item.addressId}
                type="button"
                onClick={() => handleSelect(item)}
                // 1. Changed 'items-start' to 'items-center' right here:
                className={`flex w-full items-center gap-3 rounded-full border p-3 sm:p-3.5 text-left transition-all ${
                    isSelected
                    ? "border-red-500 bg-red-50/50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                >
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isSelected
                        ? "bg-red-100 text-red-500"
                        : "bg-slate-50 text-slate-400"
                    }`}
                >
                    <MapPin size={17} />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900">
                    {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    {item.address}
                    </span>
                </span>

                {isSelected && (
                    // 2. Removed 'mt-0.5' here so the checkmark stays perfectly centered
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                    <Check size={12} />
                    </span>
                )}
                </button>
            );
          })}

          <button
            type="button"
            onClick={() => router.push("/delivery-address/new")}
            className="flex items-center justify-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:border-red-400 hover:text-red-600"
          >
            <Plus size={15} />
            Add new address
          </button>
        </div>

        {(error || isError) && (
          <p className="mt-3 text-center text-xs sm:text-sm text-red-600">
            {error || "We couldn't load your addresses. Please try again."}
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={isSavingAddress}
          className="mt-4 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-semibold tracking-wide text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
        >
          {isSavingAddress && <Loader2 size={16} className="animate-spin" />}
          Continue to checkout
        </button>
      </div>
    </main>
  );
}
