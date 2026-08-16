import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { validateOrigin } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

const WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

const TYPE_PATH_MAP: Record<string, string[]> = {
  speaker: ["/[locale]", "/[locale]/speakers"],
  teamMember: ["/[locale]/team"],
  activation: ["/[locale]/activations"],
  session: ["/[locale]/schedule"],
  sponsor: ["/[locale]"],
  galleryImage: ["/[locale]/venue"],
  eventInfo: ["/[locale]", "/[locale]/speakers", "/[locale]/schedule"],
};

function verifySecret(request: Request): boolean {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret && WEBHOOK_SECRET && querySecret === WEBHOOK_SECRET) {
    return true;
  }

  const bodySecret = request.headers.get("x-sanity-webhook-secret");
  if (bodySecret && WEBHOOK_SECRET && bodySecret === WEBHOOK_SECRET) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  const originCheck = validateOrigin(request);
  if (originCheck) return originCheck;

  const rateCheck = await checkRateLimit(request, "revalidate");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // الأمان: بدون مفتاح webhook مُعدّ لا يُقبل أي طلب — حتى لا يُترك
  // الـ endpoint مفتوحاً لإعادة بناء الموقع بالكامل من أي مهاجم.
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 503 }
    );
  }

  if (!verifySecret(request)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  let body: { _type?: string; _id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { _type } = body;

  if (_type && _type in TYPE_PATH_MAP) {
    const paths = TYPE_PATH_MAP[_type];
    for (const path of paths) {
      revalidatePath(path, "page");
    }
    return NextResponse.json({ revalidated: true, type: _type, paths });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({
    revalidated: true,
    type: _type || "unknown",
    paths: ["all"],
  });
}
