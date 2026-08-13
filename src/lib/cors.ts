import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://www.tedxalfalahyouth.com",
  "https://tedxalfalahyouth.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

const origins = process.env.ALLOWED_API_ORIGINS
  ? process.env.ALLOWED_API_ORIGINS.split(",")
  : ALLOWED_ORIGINS;

export function validateOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");

  if (!origin) return null;

  if (origins.includes(origin)) return null;

  return NextResponse.json(
    { error: "Forbidden: origin not allowed" },
    { status: 403 }
  );
}
