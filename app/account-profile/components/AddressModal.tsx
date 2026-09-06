"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { createPortal } from "react-dom";

import LocationPickerMap from "@/app/components/address/LocationPickerMap";
import DirhamIcon from "@/app/components/icon/DirhamIcon";
import {
  reverseGeocode,
  searchPlace,
  validateDeliveryZone,
  type DeliveryZoneInfo,
} from "@/app/lib/geocoding";
import {
  addDeliveryAddress,
  getCustomerName,
  readCustomerPortalSnapshot,
} from "@/app/lib/customerPortal";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "@/app/redux/api";
import type { DeliveryAddressItem } from "@/app/lib/customerPortal";

type LatLng = { lat: number; lng: number };
type AddressLabel = "Home" | "Office" | "Other";

const ADDRESS_LABELS: AddressLabel[] = ["Home", "Office", "Other"];

const emptyForm = {
  building: "",
  street: "",
  area: "",
  city: "",
  emirate: "",
  country: "United Arab Emirates",
  landmark: "",
};

const toAddressTitle = (phone: string, label: string) =>
  `${phone}-${label.trim().toLowerCase().replaceAll(/\s+/g, "-")}`;

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  existingAddress?: DeliveryAddressItem | null;
}

export default function AddressModal({
  open,
  onClose,
  onSaved,
  existingAddress,
}: Readonly<AddressModalProps>) {
  const [phone] = useState(() => readCustomerPortalSnapshot().phone);
  const [customerName] = useState(() => getCustomerName());
  const [coordinates, setCoordinates] = useState<LatLng | null>(() => {
    if (existingAddress?.latitude && existingAddress?.longitude) {
      const lat = Number(existingAddress.latitude);
      const lng = Number(existingAddress.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng };
      }
    }
    return null;
  });

  const [form, setForm] = useState(() => {
    if (existingAddress) {
      const parts = (existingAddress.address || "").split(",").map((s) => s.trim());
      return {
        building: parts[0] || "",
        street: parts[1] || "",
        area: parts[2] || "",
        city: parts[3] || "Dubai",
        emirate: parts[4] || "",
        country: "United Arab Emirates",
        landmark: "",
      };
    }
    return emptyForm;
  });
  const [label, setLabel] = useState<AddressLabel>(() => {
    const type = existingAddress?.addressType || existingAddress?.title;
    if (type === "Home" || type === "Office" || type === "Other") return type;
    return "Home";
  });
  const [zone, setZone] = useState<DeliveryZoneInfo | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  const [createAddress, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();

  const isSaving = isCreating || isUpdating;

  // Handle Pick
  const handlePick = useCallback(async (picked: LatLng) => {
    setCoordinates(picked);
    setIsLocating(true);
    setError("");

    const [geocoded, zoneInfo] = await Promise.allSettled([
      reverseGeocode(picked.lat, picked.lng),
      validateDeliveryZone(picked.lat, picked.lng),
    ]);

    if (geocoded.status === "fulfilled") {
      const value = geocoded.value;
      setForm((current) => ({
        ...current,
        building: value.building,
        street: value.street,
        area: value.area,
        city: value.city,
        emirate: value.emirate,
        country: value.country || current.country,
      }));
    }

    if (zoneInfo.status === "fulfilled") {
      setZone(zoneInfo.value);
      if (!zoneInfo.value.inRange) {
        setError("This point is outside our delivery area.");
      }
    }

    setIsLocating(false);
  }, []);

  // Handle initial coordinates delivery zone calculation
  useEffect(() => {
    if (!open) return;
    if (existingAddress?.latitude && existingAddress?.longitude) {
      const lat = Number(existingAddress.latitude);
      const lng = Number(existingAddress.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        void validateDeliveryZone(lat, lng).then((z) => setZone(z));
      }
    }
  }, [open, existingAddress]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!coordinates) {
      setError("Pick your location on the map first.");
      return;
    }

    if (!customerName) {
      setError("No customer profile found. Please login again.");
      return;
    }

    const addressLine1 = [form.building, form.street, form.area, form.city]
      .filter(Boolean)
      .join(", ");

    if (!addressLine1) {
      setError("Add at least a street or area for this address.");
      return;
    }

    try {
      setError("");
      if (existingAddress?.addressId) {
        // Edit flow
        const response = await updateAddress({
          addressName: existingAddress.addressId,
          address_title: toAddressTitle(phone || customerName, label),
          address_type: "Shipping",
          address_line1: addressLine1,
          address_line2: form.landmark || undefined,
          city: form.city || form.emirate,
          country: form.country || "United Arab Emirates",
          phone: phone || undefined,
          custom_latitude: String(coordinates.lat),
          custom_longitude: String(coordinates.lng),
          custom_delivery_zone: zone?.zoneName || undefined,
        }).unwrap();

        const updated = response.data;
        addDeliveryAddress({
          id: updated.name,
          title: label,
          addressType: label,
          address: updated.address_line1,
          addressId: updated.name,
          latitude: String(coordinates.lat),
          longitude: String(coordinates.lng),
        });
      } else {
        // Create flow
        const response = await createAddress({
          address_title: toAddressTitle(phone || customerName, label),
          address_type: "Shipping",
          address_line1: addressLine1,
          address_line2: form.landmark || undefined,
          city: form.city || form.emirate,
          emirate: form.emirate || undefined,
          country: form.country || "United Arab Emirates",
          phone: phone || undefined,
          custom_latitude: String(coordinates.lat),
          custom_longitude: String(coordinates.lng),
          custom_delivery_zone: zone?.zoneName || undefined,
          links: [{ link_doctype: "Customer", link_name: customerName }],
        }).unwrap();

        const created = response.data;
        if (zone?.zoneName) {
          globalThis.localStorage?.setItem("uae_delivery_zone", zone.zoneName);
          globalThis.localStorage?.setItem(
            "uae_delivery_charge",
            String(zone.deliveryCharge)
          );
        }

        addDeliveryAddress({
          id: created.name,
          title: label,
          addressType: label,
          address: created.address_line1,
          addressId: created.name,
          latitude: String(coordinates.lat),
          longitude: String(coordinates.lng),
        });
      }

      onSaved();
      onClose();
    } catch (saveError) {
      console.error("Failed to save address", saveError);
      setError("We couldn't save this address. Please try again.");
    }
  };

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-3 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between ">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {existingAddress ? "Edit Address" : "Add New Address"}
            </h2>
            <p className="text-xs text-slate-500">
              Select location on the map and confirm address details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-red-600 hover:text-slate-200"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Map Container */}
        <div className="mt-3.5 h-56 sm:h-56 w-full overflow-hidden rounded-2xl">
          <LocationPickerMap
            value={coordinates}
            onPick={handlePick}
            onSearch={async (query) => {
              const found = await searchPlace(query);
              return found ? { lat: found.lat, lng: found.lng } : null;
            }}
          />
        </div>

        {/* Form Details */}
        <div className="mt-3.5 space-y-3">
          {/* Label selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-600">Address Label:</span>
            <div className="flex gap-1.5">
              {ADDRESS_LABELS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLabel(option)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    label === option
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <label className="flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              Building / villa
              <input
                value={form.building}
                onChange={(e) => updateField("building", e.target.value)}
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              Street
              <input
                value={form.street}
                onChange={(e) => updateField("street", e.target.value)}
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              Area
              <input
                value={form.area}
                onChange={(e) => updateField("area", e.target.value)}
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              City
              <input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              Emirate / State
              <input
                value={form.emirate}
                onChange={(e) => updateField("emirate", e.target.value)}
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              Country
              <input
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="col-span-2 flex flex-col gap-0.5 text-sm font-semibold text-slate-500">
              Landmark / delivery note
              <input
                value={form.landmark}
                onChange={(e) => updateField("landmark", e.target.value)}
                placeholder="Near the mosque, gate 2..."
                className="h-9 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>
          </div>

          {/* Delivery zone info */}
          {zone?.inRange && (
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
              <span>Delivers to <strong>{zone.zoneName}</strong> · Delivery fee:</span>
              <span className="inline-flex items-center gap-0.5 font-bold text-slate-800">
                <DirhamIcon size={11} />
                {zone.deliveryCharge}
              </span>
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-red-600 font-medium">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLocating || zone?.inRange === false}
              className="flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-5 py-2  text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
            >
              {isSaving && <Loader2 size={13} className="animate-spin" />}
              {existingAddress ? "Update Address" : "Save Address"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
