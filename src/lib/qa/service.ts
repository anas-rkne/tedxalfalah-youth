import { randomBytes } from "crypto";
import type { QaData, QaSession } from "./types";
import { emptyQaData } from "./defaults";

/** يبني معرّفًا عشوائيًا قصيرًا آمنًا (لا يحتاج فك تشفير). */
export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

/** يعيد الجلسة النشطة، أو null إن لم توجد جلسة نشطة. */
export function getActiveSession(data: QaData): QaSession | null {
  return data.sessions.find((s) => s.active) ?? null;
}

/** يعيد جلسة بمعرّفها، أو null. */
export function getSessionById(data: QaData, id: string): QaSession | null {
  return data.sessions.find((s) => s.id === id) ?? null;
}

/** يبني نسخة من البيانات تضمن وجود الحقول الأساسية (درع للبيانات القديمة). */
export function normalizeData(data: Partial<QaData> | null | undefined): QaData {
  const base = emptyQaData();
  if (!data) return base;
  return {
    settings: {
      ...base.settings,
      ...(data.settings ?? {}),
    },
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    meta: {
      ...base.meta,
      ...(data.meta ?? {}),
    },
  };
}
