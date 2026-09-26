"use client";

import { useSyncExternalStore } from "react";
import PostEventSurvey from "@/components/qa/PostEventSurvey";

const STORAGE = "tedx-qa-attendee";

interface Attendee {
  id: string;
  name: string;
}

/**
 * ⚠️ كان يقرأ `sessionStorage` و`location.search` داخل `useEffect` ثم
 * `setState` — وهو ما يمنعه eslint-plugin-react-hooks (set-state-in-effect)
 * لأنه يسبّب render إضافياً متتالياً. البديل الصحيح لقراءة حالة خارجية
 * (المتصفح) هو `useSyncExternalStore`.
 *
 * `getSnapshot` يجب أن يعيد **نفس المرجع** في النداءات المتتالية وإلا أدخل
 * React في حلقة لا نهائية، لذلك نُخزّن النتيجة مؤقتاً ونعيدها فقط عند تغيّر
 * النص الخام.
 */
const NOOP_SUBSCRIBE = () => () => {};

let cachedAttendeeRaw: string | null = null;
let cachedAttendee: Attendee | null = null;

function readAttendee(): Attendee | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE);
  if (raw === cachedAttendeeRaw) return cachedAttendee;
  cachedAttendeeRaw = raw;
  if (!raw) {
    cachedAttendee = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Attendee> | null;
    cachedAttendee =
      parsed && typeof parsed.id === "string" && parsed.id
        ? { id: parsed.id, name: typeof parsed.name === "string" ? parsed.name : "" }
        : null;
  } catch {
    cachedAttendee = null;
  }
  return cachedAttendee;
}

let cachedSearch = "";
let cachedSessionId: string | null = null;

function readSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const search = window.location.search;
  if (search === cachedSearch) return cachedSessionId;
  cachedSearch = search;
  cachedSessionId = new URLSearchParams(search).get("session");
  return cachedSessionId;
}

export default function SurveyPage() {
  const attendee = useSyncExternalStore(NOOP_SUBSCRIBE, readAttendee, () => null);
  const sessionId = useSyncExternalStore(NOOP_SUBSCRIBE, readSessionId, () => null);

  if (!attendee || !sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please join the session first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <PostEventSurvey sessionId={sessionId} attendeeId={attendee.id} />
    </div>
  );
}
