"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";

// استيراد المكون World بشكل ديناميكي مع ssr: false
const World = dynamic(() => import("./globe").then((m) => m.World), {
  ssr: false,
});

export function TedxGlobe() {
  const [isMounted, setIsMounted] = useState(false);

  // تأكد من أن المكون قد تم تحميله على العميل فقط
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // إذا لم يتم التحميل، نعرض مساحة فارغة بنفس النسبة لتجنب إزاحة التخطيط
  if (!isMounted) {
    return <div className="w-full max-w-md aspect-square rounded-full bg-transparent" />;
  }

  // إعدادات الكرة الأرضية بألوان TEDx
  const globeConfig = {
    pointSize: 4,
    globeColor: "#7f1d1d", // أحمر داكن
    showAtmosphere: true,
    atmosphereColor: "#fca5a5", // وردي ناعم
    atmosphereAltitude: 0.15,
    emissive: "#450a0a",
    emissiveIntensity: 0.2,
    shininess: 0.9,
    polygonColor: "rgba(255,255,255,0.7)",
    ambientLight: "#ffedd5",
    directionalLeftLight: "#fecdd3",
    directionalTopLight: "#fca5a5",
    pointLight: "#ffffff",
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 6,
    initialPosition: { lat: 25.2048, lng: 55.2708 }, // دبي، الإمارات
    autoRotate: true,
    autoRotateSpeed: 0.5,
  };

  // ألوان الأقواس (أحمر، برتقالي، وردي)
  const colors = ["#dc2626", "#f97316", "#f43f5e", "#b91c1c"];

  // مصفوفة أقواس الطيران (يمكنك اختصارها أو إبقائها كاملة)
  const sampleArcs = [
    { order: 1, startLat: -19.885592, startLng: -43.951191, endLat: -22.9068, endLng: -43.1729, arcAlt: 0.1, color: colors[0] },
    { order: 2, startLat: 28.6139, startLng: 77.209, endLat: 3.139, endLng: 101.6869, arcAlt: 0.2, color: colors[1] },
    { order: 3, startLat: -19.885592, startLng: -43.951191, endLat: -1.303396, endLng: 36.852443, arcAlt: 0.5, color: colors[2] },
    { order: 4, startLat: 1.3521, startLng: 103.8198, endLat: 35.6762, endLng: 139.6503, arcAlt: 0.2, color: colors[0] },
    { order: 5, startLat: 51.5072, startLng: -0.1276, endLat: 3.139, endLng: 101.6869, arcAlt: 0.3, color: colors[1] },
    { order: 6, startLat: -15.785493, startLng: -47.909029, endLat: 36.162809, endLng: -115.119411, arcAlt: 0.3, color: colors[2] },
    { order: 7, startLat: -33.8688, startLng: 151.2093, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.3, color: colors[0] },
    { order: 8, startLat: 21.3099, startLng: -157.8581, endLat: 40.7128, endLng: -74.006, arcAlt: 0.3, color: colors[1] },
    { order: 9, startLat: -6.2088, startLng: 106.8456, endLat: 51.5072, endLng: -0.1276, arcAlt: 0.3, color: colors[2] },
    { order: 10, startLat: 11.986597, startLng: 8.571831, endLat: -15.595412, endLng: -56.05918, arcAlt: 0.5, color: colors[0] },
    { order: 11, startLat: -34.6037, startLng: -58.3816, endLat: 22.3193, endLng: 114.1694, arcAlt: 0.7, color: colors[1] },
    { order: 12, startLat: 51.5072, startLng: -0.1276, endLat: 48.8566, endLng: -2.3522, arcAlt: 0.1, color: colors[2] },
    { order: 13, startLat: 14.5995, startLng: 120.9842, endLat: 51.5072, endLng: -0.1276, arcAlt: 0.3, color: colors[0] },
    { order: 14, startLat: 1.3521, startLng: 103.8198, endLat: -33.8688, endLng: 151.2093, arcAlt: 0.2, color: colors[1] },
  ];

  return (
 <div className="relative w-full max-w-md aspect-square rounded-full overflow-hidden">
      <World data={sampleArcs} globeConfig={globeConfig} />
    </div>
  );
}