"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useCreateCustomerMutation,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useSetCustomerInfoMutation,
  baseUrl,
} from "../../../redux/api";
import ConfirmDialog from "../../shared/ConfirmDialog";
import {
  getCustomerName,
  saveCustomerName,
  addDeliveryAddress,
} from "@/app/lib/customerPortal";
import { AlertTriangle } from 'lucide-react';
import DirhamIcon from "../../icon/DirhamIcon";

export type SelectedAddress = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  delivery_zone?: string;
  delivery_charge?: number;
};

export type AddressSelectModalProps = {
  open: boolean;
  onSelect: (address: SelectedAddress) => void;
  onClose: () => void;
  redirectTo?: string | null;
  addressType?: "Shipping" | "Billing";
  skipCustomerCreation?: boolean;
  customTitle?: string; // e.g. "Home", "Office" — used as label in ERPNext address name
  existingAddressId?: string | null;
};

const AddressSelectModal: React.FC<AddressSelectModalProps> = ({
  open,
  onSelect,
  onClose,
  redirectTo = "/checkout",
  addressType = "Shipping",
  skipCustomerCreation = false,
  customTitle,
  existingAddressId,
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
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [createCustomer] = useCreateCustomerMutation();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [setCustomerInfo] = useSetCustomerInfoMutation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [deliveryZone, setDeliveryZone] = useState<string>("");
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);
  const [isOutOfRange, setIsOutOfRange] = useState<boolean>(false);



  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoading(true);
    setIsOutOfRange(false);
    setError("");
    try {
      // 1. Run standard OpenStreetMap text lookup
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const geoData = await geoResponse.json();
      const name = geoData.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setAddressText(name);

      // 2. Query your live custom Frappe Spatial engine
      const token = process.env.NEXT_PUBLIC_ERP_API_TOKEN || "";
      const zoneResponse = await fetch(
        `${baseUrl}/api/method/pizza_app.api.validate_coordinate_zone?lat=${lat}&lng=${lng}`,
        {
          headers: {
            Authorization: `token ${token}`,
            "X-Frappe-Site-Name": "kababrayhan.com",
          },
        }
      );

      if (zoneResponse.ok) {
        const zoneData = await zoneResponse.json();
        if (zoneData.message?.status === "success") {
          const res = zoneData.message;
          if (res.zone_found) {
            setDeliveryZone(res.zone_name);
            setDeliveryCharge(res.delivery_charge);
          } else {
            setIsOutOfRange(true);
            setDeliveryZone("");
            setDeliveryCharge(0);
            setError("Selected point is out of our active delivery boundaries.");
          }
        }
      }
    } catch (error) {
      console.error("Address or Zone lookup failed", error);
      setAddressText(`Dropped Pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsLoading(false);
    }
  };


  // const fetchAddress = async (lat: number, lng: number) => {
  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(
  //       `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
  //     );
  //     const data = await response.json();
  //     // Use short name or full address
  //     const name =
  //       data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  //     setAddressText(name);
  //   } catch (error) {
  //     console.error("Address reverse-geocode failed", error);
  //     setAddressText(`Dropped Pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const lookupCustomersByMobile = async (mobileNo: string) => {
    const filters = encodeURIComponent(
      JSON.stringify([["mobile_no", "=", mobileNo]])
    );
    const fields = encodeURIComponent(
      JSON.stringify(["name", "customer_name", "mobile_no"])
    );
    const token = process.env.NEXT_PUBLIC_ERP_API_TOKEN || "";

    const response = await fetch(
      `${baseUrl}/api/resource/Customer?filters=${filters}&fields=${fields}&limit_page_length=20`,
      {
        headers: {
          Authorization: `token ${token}`,
          "X-Frappe-Site-Name": "kababrayhan.com",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to lookup customer: ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{
        name: string;
        customer_name?: string;
        mobile_no?: string;
      }>;
    };

    return payload.data ?? [];
  };


  /* * NEW * REUSABLE CURRENT LOCATION GEOLOCATION LOGIC FUNCTION */
  const requestCurrentLocation = (mapInstance: any, L: any, showAlertOnFail: boolean = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Move map and set zoom close
          mapInstance?.setView([latitude, longitude], 17);

          // Update tracking state and trigger address lookups
          setSelectedLatLng({ lat: latitude, lng: longitude });
          fetchAddress(latitude, longitude);

          if (L) {
            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            } else {
              markerRef.current = L.marker([latitude, longitude], {
                bounceOnAdd: true,
              }).addTo(mapInstance);
            }
          }
        },
        (error) => {
          console.error("Auto Geolocation error:", error);
          if (showAlertOnFail) {
            setShowLocationAlert(true);
          }
          // Fallback map position if block/error occurs
          mapInstance?.setView([25.2048, 55.2708], 13);
        }
      );
    } else if (showAlertOnFail) {
      mapInstance?.setView([25.2048, 55.2708], 13);
    }
  };
  /* * END NEW * */


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

        requestCurrentLocation(map, L, false);

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
              onClick={() => {
                /* * NEW * TRIGGER THE EXTRACTED FUNCTION VIA THE MANUAL RE-CENTER BUTTON CLICK */
                const L = (globalThis as typeof globalThis & { L?: any }).L;
                requestCurrentLocation(mapInstanceRef.current, L, true);
                /* * END NEW * */
              }}
              className="bg-white/90 backdrop-blur shadow-xl border border-gray-100 px-4 py-2 rounded-2xl font-normal text-gray-800 flex items-center gap-2 hover:bg-white transition-all active:scale-95"
            >
              <span className="text-red-500 text-base">📍</span> Current
              Location
            </button>
          </div>

          <button
            onClick={onClose}
            className="pointer-events-auto bg-white/90 backdrop-blur text-gray-400 hover:text-red-600 rounded-2xl w-10 h-10 flex items-center justify-center shadow-xl border border-gray-100 transition-all active:scale-90 text-3xl font-light"
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
                <div className="absolute top-10 whitespace-nowrap bg-gray-900/80 text-white px-3 py-1 rounded-lg text-xs font-normal tracking-wide">
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
              <h3 className="text-sm font-medium  tracking-widest text-red-600">
                Confirm Delivery Point
              </h3>
              <div className="min-h-12 flex items-center">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-gray-400 italic">
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Fetching address details...
                  </div>
                ) : (
                  <p className="text-gray-800 font-medium text-lg line-clamp-2 leading-tight tracking-wide">
                    {addressText || "Tap the map to select your location"}
                  </p>
                )}
              </div>

              {/* DELIVERY FEEDBACK PANEL */}
              {!isLoading && selectedLatLng && (
                <>
                  {isOutOfRange ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                      {/* <span className="mt-0.5 shrink-0 text-lg leading-none">⚠️</span> */}
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-base">Out of Delivery Range</span>
                        <span className="font-normal opacity-90">
                          This address is outside our standard delivery zone. To place an order, please contact our support team directly at +971 50 302 1317.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 p-3 border border-red-100 rounded-2xl bg-red-50/50">
                      {deliveryCharge > 0 ? (
                        // PAID DELIVERY UX
                        <div className="flex items-center justify-between gap-2 px-1 text-sm font-medium text-red-600">
                          <span className="opacity-80">Delivery Charge</span>
                          <span className="flex items-center gap-1 text-lg font-bold text-red-600">
                            <DirhamIcon size={18} className="text-red-600" />
                            {deliveryCharge.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        // FREE DELIVERY UX (Clean, warm, formal)
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-800">
                          <span className="text-lg leading-none">✓</span>
                          You qualify for Free Delivery!
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* <div className="space-y-1">
              <h3 className="text-sm font-medium tracking-wide text-red-500">
                Confirm Delivery Point
              </h3>
              <div className="min-h-12 flex items-center">
                {isLoading ? (
                  <div className="flex items-center gap-3 text-gray-400 italic">
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Fetching address details...
                  </div>
                ) : (
                  <p className="text-gray-800 font-medium text-lg line-clamp-2 leading-tight tracking-wide">
                    {addressText || "Tap the map to select your location"}
                  </p>
                )}
              </div>
              {isOutOfRange && !isLoading && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 shrink-0 text-base leading-none">⚠️</span>
                  <span className="font-medium">
                    This location is outside our delivery area. Please select a point within our service zone.
                  </span>
                </div>
              )}
              {!isOutOfRange && deliveryZone && !isLoading && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  <span className="text-base leading-none">✓</span>
                  <span className="font-medium">
                    {deliveryZone}
                    {deliveryCharge > 0 ? ` · AED ${deliveryCharge.toFixed(2)} delivery` : " · Free delivery"}
                  </span>
                </div>
              )}
            </div> */}

            <button
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-5 rounded-[1.5rem] font-medium tracking-wide transition-all shadow-lg shadow-red-200 active:scale-[0.98]"
              disabled={!selectedLatLng || isLoading || submitting || isOutOfRange}
              onClick={async () => {
                setSubmitting(true);
                setError("");
                try {
                  const phone = localStorage.getItem("uae_phone");
                  if (!phone) throw new Error("No phone found.");

                  // The stable ERPNext Customer document name is the original
                  // phone used when the customer was first created. Subsequent
                  // phone changes only update mobile_no — they never create a
                  // new customer record.
                  let customerName = getCustomerName() || phone;
                  const phoneChanged = customerName !== phone;

                  // 1. Customer creation / phone-number update
                  if (!skipCustomerCreation) {
                    if (phoneChanged) {
                      // Existing customer updating their phone — patch mobile_no
                      try {
                        await setCustomerInfo({
                          customerName,
                          fieldname: "mobile_no",
                          value: phone,
                        }).unwrap();
                      } catch (e) {
                        console.warn(
                          "Could not update customer mobile_no, continuing...",
                          e
                        );
                      }
                    } else {
                      const existingCustomers = await lookupCustomersByMobile(
                        phone
                      );

                      if (existingCustomers.length > 0) {
                        customerName = existingCustomers[0].name;
                        saveCustomerName(customerName);
                      } else {
                        // New session — create the customer once, then persist the
                        // real ERPNext document name so later flows reuse it.
                        const createdCustomer = await createCustomer({
                          customer_name: customerName,
                          mobile_no: phone,
                          customer_type: "Individual",
                          customer_group: "Individual",
                          territory: "United Arab Emirates",
                          email_id: "example@example.com",
                        }).unwrap();
                        console.log("the create customer payload: ", createdCustomer);

                        customerName = createdCustomer.name;
                        saveCustomerName(customerName);
                      }
                    }
                  }

                  const addressLine = addressText || "User's Street Address";
                  const hasExistingAddress = Boolean(existingAddressId);

                  const addressResponse = hasExistingAddress
                    ? await updateAddress({
                      addressName: existingAddressId!,
                      address_line1: addressLine,
                      custom_latitude: String(selectedLatLng!.lat),
                      custom_longitude: String(selectedLatLng!.lng),
                      custom_delivery_zone: deliveryZone || undefined,
                      ...(customTitle
                        ? {
                          address_title: `${phone}-${customTitle
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`,
                        }
                        : {}),
                    }).unwrap()
                    : await createAddress({
                      address_title: customTitle
                        ? `${phone}-${customTitle
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                        : addressType === "Billing"
                          ? `${phone}-delivery`
                          : phone,
                      address_type: addressType,
                      address_line1: addressLine,
                      city: "Dubai",
                      country: "United Arab Emirates",
                      custom_latitude: String(selectedLatLng!.lat),
                      custom_longitude: String(selectedLatLng!.lng),
                      custom_delivery_zone: deliveryZone || undefined,
                      links: [
                        {
                          link_doctype: "Customer",
                          link_name: customerName,
                        },
                      ],
                    }).unwrap();

                  // 3. Save to localStorage — Billing type is handled by the parent via onSelect
                  if (addressType !== "Billing") {
                    globalThis.localStorage?.setItem("uae_delivery_zone", deliveryZone);
                    globalThis.localStorage?.setItem("uae_delivery_charge", String(deliveryCharge));
                    // saveDeliveryAddress(
                    //   addressResponse.data.address_line1,
                    //   addressResponse.data.name
                    // );
                    addDeliveryAddress({
                      id: addressResponse.data.name,
                      title: customTitle || "Address",
                      address: addressResponse.data.address_line1,
                      addressId: addressResponse.data.name,
                    });
                  }

                  onSelect({
                    id: addressResponse.data.name,
                    name: addressResponse.data.address_line1,
                    lat: selectedLatLng!.lat,
                    lng: selectedLatLng!.lng,
                    delivery_zone: deliveryZone,
                    delivery_charge: deliveryCharge,
                  });

                  onClose();
                  if (redirectTo) {
                    setTimeout(() => {
                      router.push(redirectTo);
                    }, 200);
                  }
                } catch (e: any) {
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

      {showLocationAlert && (
        <ConfirmDialog
          open={true}
          onClose={() => setShowLocationAlert(false)}
          onConfirm={() => setShowLocationAlert(false)}
          title="Location Access Denied"
          message="We couldn't access your current location. The map is now showing Dubai as the default location. You can still pick your exact delivery address by tapping anywhere on the map."
          confirmText="Got it"
          variant="info"
          showCancel={false}
        />
      )}
    </div>
  );
};

export default AddressSelectModal;
