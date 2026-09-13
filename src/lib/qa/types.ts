export type QuestionStatus = "pending" | "approved" | "rejected";

export interface QaQuestion {
  id: string;
  author: string;
  text: string;
  votes: number;
  status: QuestionStatus;
  createdAt: string;
  approvedAt?: string;
  featured: boolean;
  answered?: boolean;
  anonymous?: boolean;
  sentiment?: "positive" | "negative" | "neutral";
  tag?: string;
}

export interface QaPoll {
  id: string;
  prompt: string;
  promptAr?: string;
  options: string[];
  optionsAr?: string[];
  tallies: number[];
  active: boolean;
  showResults: boolean;
  createdAt: string;
}

export interface QaSession {
  id: string;
  title: string;
  titleAr?: string;
  active: boolean;
  acceptingQuestions: boolean;
  createdAt: string;
  questions: QaQuestion[];
  polls: QaPoll[];
  attendeeNames: string[];
}

export interface QaSettings {
  eventName: string;
  eventNameAr: string;
  active: boolean;
}

export interface QaData {
  settings: QaSettings;
  sessions: QaSession[];
  meta: {
    totalAttendees: number;
    totalQuestions: number;
    totalVotes: number;
  };
}

export interface PollVoteRecord {
  sessionId: string;
  pollId: string;
  voterId: string;
  optionIndex: number;
}

/** بيانات خاصة بالتصويت تُحفظ بملف منفصل لتجنّب تضخيم الملف الرئيسي وتبسيط التحقق من عدم التكرار */
export interface QaVoteStore {
  votes: PollVoteRecord[];
}

export interface SurveyResponse {
  id: string;
  sessionId: string;
  attendeeId: string;
  nps: number;
  rating: number;
  comment?: string;
  createdAt: string;
}
