"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Layers, Loader2, Search } from "lucide-react";
import {
  fetchDeliveryZonePolygons,
  type DeliveryZonePolygon,
} from "@/app/lib/geocoding";

const LEAFLET_VERSION = "1.9.4";
const DUBAI_CENTER: [number, number] = [25.2048, 55.2708];

type LatLng = { lat: number; lng: number };

type LocationPickerMapProps = {
  value: LatLng | null;
  onPick: (coordinates: LatLng) => void;
  onSearch?: (query: string) => Promise<LatLng | null>;
  showZones?: boolean;
};

const ZONE_COLORS = [
  { color: "#ef4444", fillColor: "#ef4444" },
  { color: "#f97316", fillColor: "#f97316" },
  { color: "#f59e0b", fillColor: "#f59e0b" },
  { color: "#10b981", fillColor: "#10b981" },
  { color: "#06b6d4", fillColor: "#06b6d4" },
  { color: "#3b82f6", fillColor: "#3b82f6" },
  { color: "#8b5cf6", fillColor: "#8b5cf6" },
  { color: "#ec4899", fillColor: "#ec4899" },
];

const loadLeaflet = () =>
  new Promise<any>((resolve, reject) => {
    const existing = (globalThis as typeof globalThis & { L?: any }).L;
    if (existing) {
      resolve(existing);
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(
      "leaflet-js"
    ) as HTMLScriptElement | null;

    const handleLoad = () =>
      resolve((globalThis as typeof globalThis & { L?: any }).L);

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.async = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", () =>
      reject(new Error("Failed to load the map."))
    );
    document.body.appendChild(script);
  });

export default function LocationPickerMap({
  value,
  onPick,
  onSearch,
  showZones = true,
}: Readonly<LocationPickerMapProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const zoneLayersRef = useRef<any[]>([]);
  const onPickRef = useRef(onPick);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [zones, setZones] = useState<DeliveryZonePolygon[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(() => showZones);
  const [message, setMessage] = useState("");

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const placeMarker = useCallback((lat: number, lng: number, zoom?: number) => {
    const L = (globalThis as typeof globalThis & { L?: any }).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const position = markerRef.current.getLatLng();
        onPickRef.current({ lat: position.lat, lng: position.lng });
      });
    }

    map.flyTo([lat, lng], zoom ?? Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 0.6,
    });
  }, []);

  const renderZonePolygons = useCallback(
    (L: any, map: any, zoneList: DeliveryZonePolygon[]) => {
      // Clean up previous layers
      zoneLayersRef.current.forEach((layer) => layer.remove());
      zoneLayersRef.current = [];

      if (!zoneList.length) return;

      const layers: any[] = [];

      zoneList.forEach((zone, index) => {
        const style = ZONE_COLORS[index % ZONE_COLORS.length];
        const polygon = L.polygon(zone.points, {
          color: style.color,
          fillColor: style.fillColor,
          fillOpacity: 0.16,
          weight: 2,
          opacity: 0.85,
        });

        polygon.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px; font-weight: 600; color: #0f172a; line-height: 1.2;">
            <div>${zone.zoneName}</div>
            <div style="font-size: 10px; color: #dc2626; margin-top: 2px;">
              ${zone.deliveryCharge > 0 ? `Delivery Fee: ${zone.deliveryCharge} AED` : "Free Delivery"}
            </div>
          </div>`,
          {
            sticky: true,
            direction: "top",
            opacity: 0.95,
          }
        );

        polygon.on("click", (event: any) => {
          const { lat, lng } = event.latlng;
          onPickRef.current({ lat, lng });
        });

        polygon.addTo(map);
        layers.push(polygon);
      });

      zoneLayersRef.current = layers;

      // If no initial pin location was set, fit view to show all delivery zones
      if (!value && layers.length > 0) {
        const bounds = L.featureGroup(layers).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
        }
      }
    },
    [value]
  );

  // Fetch Delivery Zones on mount
  useEffect(() => {
    if (!showZones) return;

    let isMounted = true;

    fetchDeliveryZonePolygons()
      .then((data) => {
        if (!isMounted) return;
        setZones(data);
        const L = (globalThis as typeof globalThis & { L?: any }).L;
        const map = mapRef.current;
        if (L && map) {
          renderZonePolygons(L, map, data);
        }
      })
      .catch((err) => {
        console.warn("Could not load delivery zones for map:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingZones(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showZones, renderZonePolygons]);

  useEffect(() => {
    let isCancelled = false;

    loadLeaflet()
      .then((L) => {
        if (isCancelled || !containerRef.current || mapRef.current) return;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon-2x.png`,
          iconUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-icon.png`,
          shadowUrl: `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/images/marker-shadow.png`,
        });

        const map = L.map(containerRef.current, {
          center: value ? [value.lat, value.lng] : DUBAI_CENTER,
          zoom: value ? 16 : 12,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        ).addTo(map);
        L.control.zoom({ position: "bottomright" }).addTo(map);

        map.on("click", (event: any) => {
          const { lat, lng } = event.latlng;
          onPickRef.current({ lat, lng });
        });

        mapRef.current = map;

        // Render zones if already loaded
        if (zones.length > 0) {
          renderZonePolygons(L, map, zones);
        }

        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch((loadError) => {
        console.error(loadError);
        setMessage("The map could not be loaded. Please refresh the page.");
      });

    return () => {
      isCancelled = true;
      zoneLayersRef.current.forEach((layer) => layer.remove());
      zoneLayersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once; the pin is synced by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value) {
      placeMarker(value.lat, value.lng);
    }
  }, [value, placeMarker]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Location services are not available on this device.");
      return;
    }

    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onPickRef.current({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (locationError) => {
        console.error("Geolocation error", locationError);
        setMessage("We couldn't get your location. Pick a point on the map.");
      }
    );
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || !onSearch) return;

    setIsSearching(true);
    setMessage("");

    try {
      const found = await onSearch(trimmed);
      if (found) {
        onPickRef.current(found);
      } else {
        setMessage("No matching place found. Try another search.");
      }
    } catch (searchError) {
      console.error("Location search failed", searchError);
      setMessage("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200">
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-1001 flex items-start gap-2">
        {onSearch && (
          <form
            onSubmit={handleSearch}
            className="pointer-events-auto flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white/95 pl-3 shadow-lg backdrop-blur"
          >
            <Search size={16} className="text-red-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search area, street or landmark"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-hidden"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="mr-1 flex h-8 items-center rounded-full bg-red-600 px-3 text-xs font-semibold text-white disabled:bg-red-300"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Search"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          aria-label="Use my current location"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-red-600 shadow-lg backdrop-blur transition-transform active:scale-95"
        >
          <Crosshair size={16} />
        </button>
      </div>

      {zones.length > 0 && (
        <div className="pointer-events-none absolute left-3 bottom-3 z-1001 hidden sm:flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-md backdrop-blur border border-slate-100">
          <Layers size={13} className="text-red-600" />
          <span>{zones.length} Delivery Zones Loaded</span>
        </div>
      )}

      {isLoadingZones && (
        <div className="pointer-events-none absolute left-3 bottom-3 z-1001 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-md backdrop-blur">
          <Loader2 size={12} className="animate-spin text-red-600" />
          <span>Loading delivery zones...</span>
        </div>
      )}

      {!value && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-1001 flex justify-center">
          <span className="rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white">
            Tap the map or within a delivery zone to drop your pin
          </span>
        </div>
      )}

      {message && (
        <div className="pointer-events-none absolute inset-x-3 bottom-4 z-1002 rounded-2xl bg-slate-900/85 px-3 py-2 text-center text-xs text-white">
          {message}
        </div>
      )}
    </div>
  );
}
