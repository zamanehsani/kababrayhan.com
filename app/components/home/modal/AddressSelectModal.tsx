"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useCreateCustomerNewMutation,
  useCreateAddressMutation,
} from "../../../redux/api";
import {
  saveDeliveryAddress,
} from "@/app/lib/customerPortal";

export type SelectedAddress = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type AddressSelectModalProps = {
  open: boolean;
  onSelect: (address: SelectedAddress) => void;
  onClose: () => void;
  redirectTo?: string | null;
};

const AddressSelectModal: React.FC<AddressSelectModalProps> = ({
  open,
  onSelect,
  onClose,
  redirectTo = "/checkout",
}) => {
  const router = useRouter();
  const [addressText, setAddressText] = useState("");
  const [selectedLatLng, setSelectedLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createCustomer] = useCreateCustomerNewMutation();
  const [createAddress] = useCreateAddressMutation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      // Use short name or full address
      const name =
        data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setAddressText(name);
    } catch (error) {
      console.error("Address reverse-geocode failed", error);
      setAddressText(`Dropped Pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const leafletCssId = "leaflet-css";
    const leafletJsId = "leaflet-js";

    if (!document.getElementById(leafletCssId)) {
      const link = document.createElement("link");
      link.id = leafletCssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (globalThis as typeof globalThis & { L?: any }).L;
      if (L && mapRef.current && !mapInstanceRef.current) {
        // Fix Leaflet's default icon path issues
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current, {
          center: [25.2048, 55.2708],
          zoom: 13,
          zoomControl: false, // Positioned manually below
          attributionControl: false,
        });

        // Add standard tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
          map
        );

        // Standard Zoom controls at the bottom right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // CLICK TO PICK LOGIC
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          setSelectedLatLng({ lat, lng });

          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
          } else {
            markerRef.current = L.marker([lat, lng], {
              bounceOnAdd: true,
            }).addTo(map);
          }

          map.flyTo(e.latlng, map.getZoom(), { animate: true, duration: 0.5 });
          fetchAddress(lat, lng);
        });

        mapInstanceRef.current = map;

        // Force resize recalculation for Modals
        setTimeout(() => {
          map.invalidateSize();
        }, 400);
      }
    };

    const existingLeafletScript = document.getElementById(leafletJsId);

    if (existingLeafletScript) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.id = leafletJsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white w-full max-w-6xl h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl relative flex flex-col overflow-hidden">
        {/* Header Overlay */}
        <div className="absolute top-6 inset-x-6 z-1001 pointer-events-none flex justify-between items-start">
          <div className="pointer-events-auto flex flex-col gap-2">
            <button
              onClick={() =>
                mapInstanceRef.current?.setView([25.2048, 55.2708], 13)
              }
              className="bg-white/90 backdrop-blur shadow-xl border border-gray-100 px-5 py-2.5 rounded-2xl font-bold text-gray-800 flex items-center gap-2 hover:bg-white transition-all active:scale-95"
            >
              <span className="text-red-500 text-lg">📍</span> Recenter Dubai
            </button>
          </div>

          <button
            onClick={onClose}
            className="pointer-events-auto bg-white/90 backdrop-blur text-gray-400 hover:text-red-600 rounded-2xl w-12 h-12 flex items-center justify-center shadow-xl border border-gray-100 transition-all active:scale-90 text-3xl font-light"
          >
            ×
          </button>
        </div>

        {/* The Interactive Map Layer */}
        <div className="flex-1 relative group">
          <div
            ref={mapRef}
            className="absolute inset-0 w-full h-full cursor-crosshair z-1000"
          />

          {/* Centered Target (Visible before first click) */}
          {!selectedLatLng && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1001">
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-red-500/50 rounded-full animate-ping absolute" />
                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg" />
                <div className="absolute top-10 whitespace-nowrap bg-gray-900/80 text-white px-3 py-1 rounded-lg text-xs font-medium">
                  Click to drop pin
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Selection Panel (Floating Card Style) */}
        <div className="absolute bottom-8 inset-x-0 z-1002 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-xl bg-white/95 backdrop-blur-lg border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 sm:p-8 flex flex-col gap-4">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                Confirm Delivery Point
              </h3>
              <div className="min-h-12 flex items-center">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-gray-400 italic">
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Fetching address details...
                  </div>
                ) : (
                  <p className="text-gray-800 font-semibold text-lg line-clamp-2 leading-tight">
                    {addressText || "Tap the map to select your location"}
                  </p>
                )}
              </div>
            </div>

            <button
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-200 active:scale-[0.98]"
              disabled={!selectedLatLng || isLoading || submitting}
              onClick={async () => {
                setSubmitting(true);
                setError("");
                try {
                  const phone = localStorage.getItem("uae_phone");
                  if (!phone) throw new Error("No phone found.");

                  // 1. Create/Ensure Customer exists
                  // IMPORTANT: Make sure 'Individual' is a valid 'Customer Group' in your ERPNext
                  // that is NOT a Group (Folder).
                  try {
                    await createCustomer({
                      customer_name: phone,
                      mobile_no: phone,
                      customer_type: "Individual",
                      customer_group: "Individual", // FIX: Changed from "All Customer Groups"
                      territory: "United Arab Emirates",
                      email_id: "example@example.com",
                    }).unwrap();
                  } catch (e) {
                    // If error is "Already Exists", we continue.
                    // If error is "Validation", we might need to check our ERPNext settings.
                    console.info("Customer create skipped", e);
                    console.log("Customer might already exist, proceeding...");
                  }

                  // 2. Create Address
                  const addressLine = addressText || "User's Street Address";

                  const addressResponse = await createAddress({
                    address_title: phone,
                    address_type: "Shipping",
                    address_line1: addressLine,
                    city: "Dubai",
                    country: "United Arab Emirates", // Highly recommended to include
                    links: [
                      {
                        link_doctype: "Customer",
                        link_name: phone, // This ONLY works if your Customer Naming is set to "Customer Name"
                      },
                    ],
                  }).unwrap();
                  saveDeliveryAddress(
                    addressResponse.data.address_line1,
                    addressResponse.data.name
                  );

                  onSelect({
                    id: Date.now().toString(),
                    name: addressResponse.data.address_line1,
                    lat: selectedLatLng!.lat,
                    lng: selectedLatLng!.lng,
                  });

                  onClose();
                  if (redirectTo) {
                    setTimeout(() => {
                      router.push(redirectTo);
                    }, 200);
                  }
                } catch (e: any) {
                  // This will now capture the specific ERPNext error message
                  setError(
                    e?.data?.message || e?.message || "Failed to save address."
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Saving..." : "Confirm & Deliver Here"}
            </button>
            {error && (
              <div className="text-red-600 text-sm text-center mt-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressSelectModal;
