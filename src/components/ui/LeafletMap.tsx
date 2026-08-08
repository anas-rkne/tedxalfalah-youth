"use client";

import dynamic from "next/dynamic";

// استيراد ديناميكي لمكوّنات Leaflet (ssr: false) لتجنب أخطاء SSR في Next.js
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// أيقونة النقطة الحمراء المتوهجة (مطابقة للون TEDx)
const redIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: `<div class="relative flex items-center justify-center w-6 h-6">
           <span class="absolute inline-flex h-full w-full rounded-full bg-[#E62B1E] opacity-30 animate-ping"></span>
           <span class="relative inline-flex rounded-full h-4 w-4 bg-[#E62B1E] border-2 border-white shadow-lg"></span>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  venueName?: string | null;
}

export default function LeafletMap({
  center = [25.212, 55.282],
  zoom = 15,
  venueName,
}: LeafletMapProps) {
  return (
    <div className="w-full h-[350px] md:h-[400px] rounded-2xl overflow-hidden border border-border shadow-sm relative">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        {/* طبقة الخريطة الأساسية من OpenStreetMap (مجانية) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* النقطة الحمراء لمكان الفعالية */}
        <Marker position={center} icon={redIcon}>
          <Popup>
            <div className="text-center font-medium">
              <span className="block text-tedx-red font-bold">TEDxAlFalah Youth</span>
              <span className="text-xs text-muted-foreground">
                {venueName || "Museum of the Future, Dubai"}
              </span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* شارة TEDx في الزاوية */}
      <div className="absolute top-3 right-4 z-[400] text-[10px] font-black tracking-[0.15em] text-white/60 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none">
        TEDx
      </div>
    </div>
  );
}