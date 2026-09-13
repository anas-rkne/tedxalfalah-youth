import type { QaData, QaVoteStore } from "./types";

/** بنية البيانات الفارغة الافتراضية لنظام الأسئلة الحية. */
export function emptyQaData(): QaData {
  return {
    settings: {
      eventName: "TEDxAlFalah Youth",
      eventNameAr: "تي إي دي إكس الفلاح للشباب",
      active: true,
    },
    sessions: [],
    meta: {
      totalAttendees: 0,
      totalQuestions: 0,
      totalVotes: 0,
    },
  };
}

export function emptyVoteStore(): QaVoteStore {
  return { votes: [] };
}
