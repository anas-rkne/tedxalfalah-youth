"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapInstance } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  venueLabel?: string;
}

const VENUE_LABEL = "";

export default function LeafletMap({ center, zoom, venueLabel }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMapInstance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      const container = mapRef.current;
      if (!container) return;

      // الحماية من سباق StrictMode: الحذف بعد اكتمال الاستيراد وقبل إنشاء الخريطة مباشرة
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(container).setView(center, zoom);

      // القاعدة: قمر صناعي Esri (مجاني بلا مفتاح API)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        }
      ).addTo(map);

      // التسميات: شوارع وأسماء إنجليزية (Esri) — موحّدة باللغتين
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "&copy; Esri",
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

      const popupLabel = venueLabel || VENUE_LABEL;

      L.marker(center, { icon: venueIcon })
        .addTo(map)
        .bindPopup(
          `<div class="text-center font-medium">
             <span class="block text-[#E62B1E] font-bold">TEDxAlFalah Youth</span>
             ${popupLabel ? `<span class="text-xs opacity-70" dir="auto">${popupLabel}</span>` : ""}
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {/* طبقة تعتيم شفافة فوق البلاطات — تحت العلامة والبوب أب */}
      <div
        aria-hidden
        className="absolute inset-0 z-[450] pointer-events-none bg-slate-900/20"
      />
    </div>
  );
}