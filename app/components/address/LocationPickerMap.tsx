"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, Search } from "lucide-react";

const LEAFLET_VERSION = "1.9.4";
const DUBAI_CENTER: [number, number] = [25.2048, 55.2708];

type LatLng = { lat: number; lng: number };

type LocationPickerMapProps = {
  value: LatLng | null;
  onPick: (coordinates: LatLng) => void;
  onSearch?: (query: string) => Promise<LatLng | null>;
};

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
}: Readonly<LocationPickerMapProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onPickRef = useRef(onPick);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
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
        setTimeout(() => map.invalidateSize(), 200);
      })
      .catch((loadError) => {
        console.error(loadError);
        setMessage("The map could not be loaded. Please refresh the page.");
      });

    return () => {
      isCancelled = true;
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

      {!value && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-1001 flex justify-center">
          <span className="rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-white">
            Tap the map to drop your pin
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
