export interface Speaker {
  id: string;
  name: string;
  imageUrl: string;
  shortDescriptor: string;
  talkTitle: string;
  themeConnection: string;
  bio: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    x?: string;
  };
  wave: number;
  isPublished: boolean;
}

export type TeamDepartment =
  | "Curation"
  | "Production"
  | "Speaker Coaching"
  | "Marketing"
  | "Partnerships"
  | "Volunteers";

export interface TeamMember {
  id: string;
  name: string;
  imageUrl: string;
  role: string;
  department: TeamDepartment;
  quote?: string;
  linkedinUrl?: string;
}

export interface Activation {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  locationInVenue: string;
  order: number;
}

export type SessionType = "talk" | "break" | "activation" | "registration";

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  startTime: string; // "09:00"
  endTime: string; // "09:20"
  speakerName?: string; // اسم المتحدث إن كانت الجلسة talk
  speakerId?: string; // لربطها اختيارياً بصفحة المتحدث
  location?: string;
  description?: string;
}

export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Community";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: SponsorTier;
  websiteUrl?: string;
}
