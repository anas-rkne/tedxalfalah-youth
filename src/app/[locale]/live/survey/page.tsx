"use client";

import { useEffect, useState } from "react";
import PostEventSurvey from "@/components/qa/PostEventSurvey";

const STORAGE = "tedx-qa-attendee";

export default function SurveyPage() {
  const [attendee, setAttendee] = useState<{ id: string; name: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAttendee(parsed);
      } catch {
        /* تجاهل */
      }
    }

    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session"));
  }, []);

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
