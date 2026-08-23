"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, PencilLine, Phone, Plus, Trash2 } from "lucide-react";
import type { DeliveryAddressItem } from "@/app/lib/customerPortal";
import {
  saveDeliveryAddress,
  writeDeliveryAddresses,
} from "@/app/lib/customerPortal";
import { useUpdateAddressMutation } from "@/app/redux/api";
import AddressSelectModal, {
  type SelectedAddress,
} from "../../components/home/modal/AddressSelectModal";

type AddressesTabProps = {
  addresses: DeliveryAddressItem[];
  isLoading: boolean;
  profilePhone: string;
  onRefresh: () => void;
};

type LeafletMapInstance = {
  remove: () => void;
  setView: (center: [number, number], zoom: number) => void;
  invalidateSize: () => void;
};

type LeafletMarker = {
  addTo: (map: LeafletMapInstance) => LeafletMarker;
  setLatLng?: (coords: [number, number]) => void;
};

type LeafletTileLayer = {
  addTo: (map: LeafletMapInstance) => LeafletTileLayer;
};

type LeafletNamespace = {
  map: (
    element: HTMLDivElement,
    options: Record<string, unknown>
  ) => LeafletMapInstance;
  marker: (
    coords: [number, number],
    options?: Record<string, unknown>
  ) => LeafletMarker;
  tileLayer: (
    url: string,
    options?: Record<string, unknown>
  ) => LeafletTileLayer;
};

type AddressMapPreviewProps = {
  title?: string;
  latitude?: string;
  longitude?: string;
};

const leafletInitCallbacks = new Set<() => void>();

const ensureLeafletLoaded = (callback: () => void) => {
  if (typeof window === "undefined") return;

  const L = (window as typeof window & { L?: LeafletNamespace }).L;
  if (L) {
    callback();
    return;
  }

  const missingLeafletCss = !document.getElementById("leaflet-css");
  if (missingLeafletCss) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  leafletInitCallbacks.add(callback);

  if (document.getElementById("leaflet-js")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "leaflet-js";
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  script.async = true;
  script.onload = () => {
    const readyLeaflet = (window as typeof window & { L?: LeafletNamespace }).L;
    if (!readyLeaflet) return;

    Array.from(leafletInitCallbacks).forEach((initCallback) => initCallback());
    leafletInitCallbacks.clear();
  };
  document.body.appendChild(script);
};

function AddressMapPreview({
  title,
  latitude,
  longitude,
}: AddressMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);

  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);
  const hasCoordinates =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  useEffect(() => {
    if (!hasCoordinates || !mapRef.current || typeof window === "undefined") {
      return;
    }

    const initMap = () => {
      const L = (window as typeof window & { L?: LeafletNamespace }).L;
      if (!L || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current, {
        center: [parsedLat, parsedLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        tap: false,
        touchZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.marker([parsedLat, parsedLng]).addTo(map);

      map.setView([parsedLat, parsedLng], 15);
      setTimeout(() => map.invalidateSize(), 150);
      mapInstanceRef.current = map;
    };

    ensureLeafletLoaded(initMap);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      leafletInitCallbacks.delete(initMap);
    };
  }, [hasCoordinates, parsedLat, parsedLng]);

  if (!hasCoordinates) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#edf2f7_50%,_#e2e8f0)]">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <MapPin size={28} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Pin not set
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="relative z-10 h-full w-full"
      style={{ zIndex: 10 }}
      aria-label={`${title || "Address"} map location`}
    />
  );
}

export default function AddressesTab({
  addresses,
  isLoading,
  profilePhone,
  onRefresh,
}: AddressesTabProps) {
  const [activeDeliveryIndex, setActiveDeliveryIndex] = useState<number | null>(null);
  const [updateAddress] = useUpdateAddressMutation();

  const handleAddressSelect = (addressData: SelectedAddress) => {
    if (activeDeliveryIndex === null) return;

    const normalizedTitle = addressData.title || "Home";
    const normalizedType = addressData.addressType || "Home";

    if (activeDeliveryIndex < 0) {
      const newAddress: DeliveryAddressItem = {
        id: addressData.id,
        title: normalizedTitle,
        address: addressData.name || "",
        addressId: addressData.id,
        addressType: normalizedType,
        latitude: String(addressData.lat),
        longitude: String(addressData.lng),
      };

      const updatedAddresses = [...addresses, newAddress];
      writeDeliveryAddresses(updatedAddresses);
      saveDeliveryAddress(newAddress.address, newAddress.addressId);
      onRefresh();
      setActiveDeliveryIndex(null);
      return;
    }

    const updatedAddresses = addresses.map((address, index) =>
      index === activeDeliveryIndex
        ? {
            ...address,
            title: normalizedTitle,
            addressType: normalizedType,
            address: addressData.name || "",
            addressId: addressData.id,
            latitude: String(addressData.lat),
            longitude: String(addressData.lng),
          }
        : address
    );
    writeDeliveryAddresses(updatedAddresses);
    if (activeDeliveryIndex === 0) {
      saveDeliveryAddress(addressData.name || "", addressData.id);
    }
    onRefresh();
    setActiveDeliveryIndex(null);
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (!addressId) return;

    try {
      await updateAddress({
        addressName: addressId,
        disabled: 1,
      }).unwrap();
    } catch (error) {
      console.error("Failed to disable address:", error);
      return;
    }

    const updatedAddresses = addresses.filter(
      (address) => address.addressId !== addressId && address.id !== addressId
    );

    writeDeliveryAddresses(updatedAddresses);

    if (updatedAddresses.length === 0) {
      saveDeliveryAddress("", "");
    } else if (activeDeliveryIndex === 0) {
      saveDeliveryAddress(updatedAddresses[0].address, updatedAddresses[0].addressId);
    }

    onRefresh();
    setActiveDeliveryIndex(null);
  };
  const handleAddNewAddress = () => {
    // Do not create a temporary empty address entry in local state or storage.
    // The modal should only persist a new address after the user confirms it.
    setActiveDeliveryIndex(-1);
  };

  return (
    <>
      <div className="py-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <MapPin size={20} />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-900">Delivery Addresses</p>
                <p className="text-xs text-slate-500">Manage your saved locations</p>
            </div>
        </div>
          <button type="button" onClick={handleAddNewAddress} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-red-200 hover:text-red-600" aria-label="Add another address"><Plus size={16} strokeWidth={2} /></button>
        </div>
        <div className="space-y-5">
          {isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
                <p className="mt-2 text-sm text-slate-500">Loading saved addresses...</p>
            </div> : addresses.length > 0 ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((delivery, index) => <div key={delivery.id ?? String(index)} className="group relative z-10 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.1)]">
              <div className="relative z-10 h-44 overflow-hidden border-b border-slate-100 bg-slate-100">
                <AddressMapPreview
                  title={delivery.title || (index === 0 ? "Home" : "Address")}
                  latitude={delivery.latitude}
                  longitude={delivery.longitude}
                />
                <button type="button" onClick={() => setActiveDeliveryIndex(index)} className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#5d1a80] text-white shadow-lg shadow-violet-200/80 transition-transform hover:scale-105" aria-label={`View map for ${delivery.title || `Address ${index + 1}`}`}>
                    <MapPin size={20} className="text-white" />
                </button>
            <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                <button type="button" onClick={() => setActiveDeliveryIndex(index)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1f9d94]/30 bg-white/90 text-[#0f766e] shadow-lg shadow-slate-200/80 backdrop-blur-sm transition-transform hover:scale-105" aria-label="Edit address" title="Edit address">
                    <PencilLine size={15} />
                </button>
                <button type="button" onClick={() => void handleRemoveAddress(delivery.addressId || delivery.id || "")} className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-white/90 text-red-600 shadow-lg shadow-red-100/80 backdrop-blur-sm transition-transform hover:scale-105" aria-label="Remove address" title="Remove address">
                    <Trash2 size={15} />
                </button>
            </div>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#5d1a80]" />{delivery.title || (index === 0 ? "Home" : "Address")}</div>
                    {index === 0 && <span className="rounded-full bg-[#0f172a] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">Default</span>}
                </div>
            </div>
              <div className="space-y-3 p-3"><p className="block overflow-hidden text-ellipsis whitespace-nowrap text-[15px] leading-7 text-slate-700">{delivery.address || "No address selected yet"}</p><div className="space-y-2 border-t border-slate-100 pt-3"><div className="flex items-center justify-between gap-2 px-2 text-sm text-slate-600"><div className="flex items-center gap-2"><Phone size={16} className="text-[#0f766e]" /><span>{profilePhone}</span></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{delivery.addressType || delivery.title || "Home"}</span></div></div></div>
            </div>)}
          </div> : <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center"><MapPin size={32} className="mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-500">No delivery addresses saved yet</p></div>}
        </div>
      </div>

      {activeDeliveryIndex !== null && (
        <AddressSelectModal
          open={true}
          onClose={() => setActiveDeliveryIndex(null)}
          onSelect={handleAddressSelect}
          onRemove={handleRemoveAddress}
          redirectTo={null}
          existingAddressId={
            activeDeliveryIndex >= 0 ? addresses[activeDeliveryIndex]?.addressId || null : null
          }
          customTitle={
            activeDeliveryIndex >= 0 ? addresses[activeDeliveryIndex]?.title || undefined : undefined
          }
          defaultAddressType={
            activeDeliveryIndex >= 0 ? addresses[activeDeliveryIndex]?.addressType || "Home" : "Home"
          }
          initialCoordinates={
            activeDeliveryIndex >= 0 && addresses[activeDeliveryIndex]?.latitude && addresses[activeDeliveryIndex]?.longitude
              ? {
                  lat: Number(addresses[activeDeliveryIndex].latitude),
                  lng: Number(addresses[activeDeliveryIndex].longitude),
                }
              : undefined
          }
        />
      )}
    </>
  );
}
