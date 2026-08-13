"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapInstance } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  venueLabel?: string;
}

const VENUE_LABEL = "نبض الفلاح — أبوظبي";

export default function LeafletMap({ center, zoom, venueLabel }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      const map = L.map(mapRef.current!).setView(center, zoom);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // نقطة مكان الحدث — حمراء نابضة (هوية TEDx #E62B1E)
      const venueIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute inline-flex h-full w-full rounded-full bg-[#E62B1E] opacity-40 animate-ping"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-[#E62B1E] border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(center, { icon: venueIcon })
        .addTo(map)
        .bindPopup(
          `<div class="text-center font-medium">
             <span class="block text-[#E62B1E] font-bold">TEDxAlFalah Youth</span>
             <span class="text-xs opacity-70">${venueLabel || VENUE_LABEL}</span>
           </div>`,
          { closeButton: false }
        );

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, venueLabel]);

  return <div ref={mapRef} className="w-full h-full" />;
}