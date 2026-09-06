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

export type DeliveryZonePolygon = {
  name: string;
  zoneName: string;
  deliveryCharge: number;
  points: Array<[number, number]>; // [lat, lng]
};

const parseJSONIfNeeded = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizePolygonPoints = (
  coordValue: unknown
): Array<[number, number]> | null => {
  const normalizedValue = parseJSONIfNeeded(coordValue);
  if (!Array.isArray(normalizedValue) || normalizedValue.length === 0) {
    return null;
  }

  const parsePoint = (point: unknown): [number, number] | null => {
    if (point && typeof point === "object") {
      const obj = point as Record<string, unknown>;
      const lng = Number(obj.longitude ?? obj.lng ?? obj.lon);
      const lat = Number(obj.latitude ?? obj.lat);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return [lat, lng];
      }
    }
    if (Array.isArray(point) && point.length >= 2) {
      const first = Number(point[0]);
      const second = Number(point[1]);
      if (Number.isFinite(first) && Number.isFinite(second)) {
        const isLngFirst = Math.abs(first) > Math.abs(second);
        const lat = isLngFirst ? second : first;
        const lng = isLngFirst ? first : second;
        return [lat, lng];
      }
    }
    return null;
  };

  const parseRing = (ring: unknown): Array<[number, number]> | null => {
    if (!Array.isArray(ring) || ring.length === 0) {
      return null;
    }
    const points = ring
      .map((point) => parsePoint(point))
      .filter((point): point is [number, number] => point !== null);
    return points.length >= 3 ? points : null;
  };

  const direct = parseRing(normalizedValue);
  if (direct) return direct;

  if (Array.isArray(normalizedValue[0]) && Array.isArray(normalizedValue[0][0])) {
    const nestedRing = parseRing(normalizedValue[0]);
    if (nestedRing) return nestedRing;
  }

  for (const item of normalizedValue) {
    if (Array.isArray(item)) {
      const nested = parseRing(item);
      if (nested) return nested;
    }
  }

  return null;
};

export const fetchDeliveryZonePolygons = async (): Promise<
  DeliveryZonePolygon[]
> => {
  const result = await callErpApi<{
    data?: Array<{
      name: string;
      zone_name?: string;
      zone_polygon_data?: unknown;
      delivery_charge?: number;
      is_active?: number;
    }>;
  }>({
    url: "/api/resource/Delivery Zone",
    params: {
      filters: JSON.stringify([["is_active", "=", 1]]),
      fields: JSON.stringify([
        "name",
        "zone_name",
        "zone_polygon_data",
        "delivery_charge",
        "is_active",
      ]),
      limit_page_length: 100,
    },
  });

  const docs = result.data?.data ?? [];
  const polygons: DeliveryZonePolygon[] = [];

  for (const doc of docs) {
    const points = normalizePolygonPoints(doc.zone_polygon_data);
    if (points && points.length >= 3) {
      polygons.push({
        name: doc.name,
        zoneName: doc.zone_name || doc.name,
        deliveryCharge: Number(doc.delivery_charge ?? 0),
        points,
      });
    }
  }

  return polygons;
};
