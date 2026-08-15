"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMapInstance } from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  venueLabel?: string;
}

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

      const map = L.map(container, { attributionControl: false }).setView(center, zoom);

      // عنصر الإسناد: بلا بادئة "Leaflet" (BSD — غير مطلوب)، مع الإبقاء على إسناد CARTO/OSM الرسمي
      L.control.attribution({ prefix: false }).addTo(map);

      // القاعدة: خريطة رمادية فاتحة (CARTO Positron — مجانية بلا مفتاح API)
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

      // النقر على النقطة يفتح الموقع في Google Maps (نافذة جديدة)
      const mapUrl =
        process.env.NEXT_PUBLIC_VENUE_MAP_URL ||
        "https://www.google.com/maps/place/%D9%86%D8%A8%D8%B6+%D8%A7%D9%84%D9%81%D9%84%D8%A7%D8%AD";

      L.marker(center, { icon: venueIcon })
        .addTo(map)
        .on("click", () => {
          window.open(mapUrl, "_blank", "noopener,noreferrer");
        });

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
    </div>
  );
}