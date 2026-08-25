export type StatusValue = "pending" | "accepted" | "rejected";
export type TrackValue = "young-speaker" | "expert";

export interface ApplicationRecord {
  _rowNumber: number;
  timestamp: string;
  track: string;
  fullName: string;
  age: string;
  email: string;
  phone: string;
  city: string;
  talkIdeaTitle: string;
  ideaSummary: string;
  whyItMatters: string;
  themeConnection: string;
  howHeardAboutUs: string;
  schoolName: string;
  guardianName: string;
  guardianContact: string;
  organizationAndRole: string;
  areaOfWorkWithYouth: string;
  parentalConsent: string;
  consentToTerms: string;
  notes: string;
  decisionEmailSentAt: string;
  status: StatusValue;
}

export const STATUS_VALUES: StatusValue[] = ["pending", "accepted", "rejected"];

export function normalizeStatus(value: unknown): StatusValue {
  return STATUS_VALUES.includes(value as StatusValue)
    ? (value as StatusValue)
    : "pending";
}

export function normalizeApplication(
  raw: Record<string, unknown>
): ApplicationRecord {
  return {
    _rowNumber: Number(raw._rowNumber) || 0,
    timestamp: String(raw.timestamp ?? ""),
    track: String(raw.track ?? ""),
    fullName: String(raw.fullName ?? ""),
    age: String(raw.age ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    city: String(raw.city ?? ""),
    talkIdeaTitle: String(raw.talkIdeaTitle ?? ""),
    ideaSummary: String(raw.ideaSummary ?? ""),
    whyItMatters: String(raw.whyItMatters ?? ""),
    themeConnection: String(raw.themeConnection ?? ""),
    howHeardAboutUs: String(raw.howHeardAboutUs ?? ""),
    schoolName: String(raw.schoolName ?? ""),
    guardianName: String(raw.guardianName ?? ""),
    guardianContact: String(raw.guardianContact ?? ""),
    organizationAndRole: String(raw.organizationAndRole ?? ""),
    areaOfWorkWithYouth: String(raw.areaOfWorkWithYouth ?? ""),
    parentalConsent: String(raw.parentalConsent ?? ""),
    consentToTerms: String(raw.consentToTerms ?? ""),
    notes: String(raw.notes ?? ""),
    decisionEmailSentAt: String(raw.decisionEmailSentAt ?? ""),
    status: normalizeStatus(raw.status),
  };
}

export function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
