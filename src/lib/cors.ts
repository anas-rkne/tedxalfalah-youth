import { NextResponse } from "next/server";
import { isTestMode, TEST_SERVER_PORT } from "@/lib/test-mode";

const ALLOWED_ORIGINS = [
  "https://www.tedxalfalahyouth.com",
  "https://tedxalfalahyouth.com",
  "http://localhost:3000",
  "http://localhost:3001",
  // منفذ خادم الاختبار الآلي — يُضاف افتراضياً كي لا يُنسى في القائمة
  // ويُصطدم بـ403 أثناء أول تشغيل (وهو بالضبط ما أوقف الاختبارات سابقاً).
  `http://localhost:${TEST_SERVER_PORT}`,
  `http://127.0.0.1:${TEST_SERVER_PORT}`,
];

const origins = process.env.ALLOWED_API_ORIGINS
  ? process.env.ALLOWED_API_ORIGINS.split(",").map((o) => o.trim())
  : ALLOWED_ORIGINS;

export function validateOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");

  // ⛔ طلب بلا `Origin` (نفس الأصل، أو curl) يُسمح به كما كان — لا تغيير.
  if (!origin) return null;

  if (origins.includes(origin)) return null;

  // وضع الاختبار يؤسّع CORS، وهو ما يسمح لمتصفح Playwright على منفذ آخر
  // بالوصول. محصور بوضعية الاختبار المحروسة، فلا يمسّ الإنتاج.
  if (isTestMode()) return null;

  return NextResponse.json(
    { error: "Forbidden: origin not allowed" },
    { status: 403 }
  );
}
