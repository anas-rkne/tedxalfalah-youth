/**
 * POST /api/qa/survey — إرسال استبيان ما بعد الفعالية.
 *
 * يقبل { sessionId, attendeeId, nps (0-10), rating (1-5), comment? }.
 *
 * الحماية: عام + Rate limit.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/cors";
import { qaError, qaJson } from "@/lib/qa/http";
import { newId } from "@/lib/qa/service";

export const dynamic = "force-dynamic";

const SURVEY_FILE = "store/qa-surveys.json";

const schema = z.object({
  sessionId: z.string().min(1).max(200),
  attendeeId: z.string().min(1).max(200),
  nps: z.number().int().min(0).max(10),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

interface SurveyStore {
  responses: Array<{
    id: string;
    sessionId: string;
    attendeeId: string;
    nps: number;
    rating: number;
    comment?: string;
    createdAt: string;
  }>;
}

async function readSurveys(): Promise<SurveyStore> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), SURVEY_FILE);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as SurveyStore;
  } catch {
    return { responses: [] };
  }
}

async function writeSurveys(store: SurveyStore): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), SURVEY_FILE);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const { allowed } = await checkRateLimit(request, "qa-survey");
  if (!allowed) return qaError("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return qaError("Invalid JSON body", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return qaError("Invalid survey data", 400, parsed.error.flatten());
  }

  const store = await readSurveys();

  // التحقق من عدم إرسال استبيان مزدوج
  const existing = store.responses.find(
    (r) => r.sessionId === parsed.data.sessionId && r.attendeeId === parsed.data.attendeeId
  );
  if (existing) {
    return qaError("You have already submitted a survey for this session.", 409);
  }

  const response = {
    id: newId("sv"),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  store.responses.push(response);
  await writeSurveys(store);

  return qaJson({ ok: true, surveyId: response.id }, 201);
}

export async function GET(request: NextRequest) {
  const originError = validateOrigin(request);
  if (originError) return originError;

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return qaError("sessionId required", 400);

  const store = await readSurveys();
  const responses = store.responses.filter((r) => r.sessionId === sessionId);

  const total = responses.length;
  const avgNps = total > 0 ? responses.reduce((s, r) => s + r.nps, 0) / total : 0;
  const avgRating = total > 0 ? responses.reduce((s, r) => s + r.rating, 0) / total : 0;
  const npsBreakdown = {
    promoters: responses.filter((r) => r.nps >= 9).length,
    passives: responses.filter((r) => r.nps >= 7 && r.nps <= 8).length,
    detractors: responses.filter((r) => r.nps <= 6).length,
  };
  const npsScore = total > 0
    ? Math.round(((npsBreakdown.promoters - npsBreakdown.detractors) / total) * 100)
    : 0;

  return qaJson({
    ok: true,
    total,
    avgNps: Math.round(avgNps * 10) / 10,
    avgRating: Math.round(avgRating * 10) / 10,
    npsScore,
    npsBreakdown,
    responses: responses.slice(-50),
  });
}
