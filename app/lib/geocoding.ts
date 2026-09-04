import { callErpApi } from "@/app/lib/erpServerAction";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export type GeocodedAddress = {
  label: string;
  building: string;
  street: string;
  area: string;
  city: string;
  emirate: string;
  country: string;
};

export type DeliveryZoneInfo = {
  inRange: boolean;
  zoneName: string;
  deliveryCharge: number;
};

type NominatimAddress = Record<string, string | undefined>;

const firstValue = (address: NominatimAddress, keys: string[]) => {
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return value;
  }
  return "";
};

// "Dubai Emirate" / "Emirate of Dubai" -> "Dubai"
const normalizeEmirate = (value: string) =>
  value
    .replace(/\bemirate of\b/i, "")
    .replace(/\b(emirate|emirates)\b/i, "")
    .replace(/\s+/g, " ")
    .trim();

const toGeocodedAddress = (payload: {
  display_name?: string;
  address?: NominatimAddress;
}): GeocodedAddress => {
  const address = payload.address ?? {};
  const emirate = normalizeEmirate(
    firstValue(address, ["state", "province", "county", "region"])
  );

  return {
    label: payload.display_name ?? "",
    building: firstValue(address, ["house_number", "house_name", "building"]),
    street: firstValue(address, ["road", "pedestrian", "street"]),
    area: firstValue(address, [
      "suburb",
      "neighbourhood",
      "quarter",
      "residential",
      "city_district",
    ]),
    city:
      firstValue(address, ["city", "town", "village", "municipality"]) ||
      emirate,
    emirate,
    country: address.country?.trim() || "United Arab Emirates",
  };
};

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GeocodedAddress> => {
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  return toGeocodedAddress(await response.json());
};

export const searchPlace = async (
  query: string
): Promise<{ lat: number; lng: number; label: string } | null> => {
  const response = await fetch(
    `${NOMINATIM_BASE_URL}/search?format=jsonv2&countrycodes=ae&limit=1&q=${encodeURIComponent(
      query
    )}`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error("Location search failed.");
  }

  const results = await response.json();
  const match = Array.isArray(results) ? results[0] : null;
  if (!match) return null;

  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
    label: match.display_name ?? query,
  };
};

export const validateDeliveryZone = async (
  lat: number,
  lng: number
): Promise<DeliveryZoneInfo> => {
  const result = await callErpApi<{
    message?: {
      status?: string;
      zone_found?: boolean;
      zone_name?: string;
      delivery_charge?: number;
    };
  }>({
    url: "/api/method/pizza_app.api.validate_coordinate_zone",
    params: { lat, lng },
  });

  const message = result.data?.message;

  if (!message || message.status !== "success" || !message.zone_found) {
    return { inRange: false, zoneName: "", deliveryCharge: 0 };
  }

  return {
    inRange: true,
    zoneName: message.zone_name ?? "",
    deliveryCharge: message.delivery_charge ?? 0,
  };
};
