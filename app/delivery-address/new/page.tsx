"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

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
import { useCreateAddressMutation } from "@/app/redux/api";

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

export default function NewDeliveryAddressPage() {
  const router = useRouter();
  const [phone] = useState(() => readCustomerPortalSnapshot().phone);
  const [customerName] = useState(() => getCustomerName());
  const [coordinates, setCoordinates] = useState<LatLng | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [label, setLabel] = useState<AddressLabel>("Home");
  const [zone, setZone] = useState<DeliveryZoneInfo | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  const [createAddress, { isLoading: isSaving }] = useCreateAddressMutation();

  useEffect(() => {
    if (!readCustomerPortalSnapshot().isVerified) {
      router.replace("/verify");
    }
  }, [router]);

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

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!coordinates) {
      setError("Pick your location on the map first.");
      return;
    }

    if (!customerName) {
      setError("We couldn't find your account. Please verify your number again.");
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
      globalThis.localStorage?.setItem("uae_delivery_zone", zone?.zoneName ?? "");
      globalThis.localStorage?.setItem(
        "uae_delivery_charge",
        String(zone?.deliveryCharge ?? 0)
      );

      addDeliveryAddress({
        id: created.name,
        title: label,
        addressType: label,
        address: created.address_line1,
        addressId: created.name,
        latitude: String(coordinates.lat),
        longitude: String(coordinates.lng),
      });

      router.replace("/delivery-address");
    } catch (saveError) {
      console.error("Failed to create address", saveError);
      setError("We couldn't save this address. Please try again.");
    }
  };

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push("/delivery-address")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft size={14} />
          Back to addresses
        </button>

        <div className="h-[45dvh] min-h-70">
          <LocationPickerMap
            value={coordinates}
            onPick={handlePick}
            onSearch={async (query) => {
              const found = await searchPlace(query);
              return found ? { lat: found.lat, lng: found.lng } : null;
            }}
          />
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold tracking-wide text-slate-900">
              Address details
            </h1>
            {isLocating && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Reading location...
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            {ADDRESS_LABELS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLabel(option)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  label === option
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Building / villa
              <input
                value={form.building}
                onChange={(event) => updateField("building", event.target.value)}
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Street
              <input
                value={form.street}
                onChange={(event) => updateField("street", event.target.value)}
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Area
              <input
                value={form.area}
                onChange={(event) => updateField("area", event.target.value)}
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              City
              <input
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Emirate / state
              <input
                value={form.emirate}
                onChange={(event) => updateField("emirate", event.target.value)}
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              Country
              <input
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500 sm:col-span-2">
              Landmark / delivery note
              <input
                value={form.landmark}
                onChange={(event) => updateField("landmark", event.target.value)}
                placeholder="Near the mosque, gate 2..."
                className="h-11 rounded-full border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-hidden focus:border-red-500"
              />
            </label>
          </div>

          {zone?.inRange && (
            <p className="mt-4 flex items-center gap-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
              Delivers to {zone.zoneName} · Delivery fee
              <DirhamIcon size={11} className="text-slate-700" />
              {zone.deliveryCharge}
            </p>
          )}

          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLocating || zone?.inRange === false}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-semibold tracking-wide text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Save address
          </button>
        </div>
      </div>
    </main>
  );
}
