export interface Speaker {
  id: string;
  name: string;
  imageUrl: string | null;
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
  order?: number;
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
  imageUrl: string | null;
  role: string;
  department: TeamDepartment;
  quote?: string;
  linkedinUrl?: string;
  isPublished?: boolean;
}

export interface Activation {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string;
  locationInVenue: string;
  order: number;
  isPublished?: boolean;
}

export type SessionType = "talk" | "break" | "activation" | "registration";

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  startTime: string;
  endTime: string;
  speakerName?: string;
  speakerId?: string;
  location?: string;
  description?: string;
  isPublished?: boolean;
}

export interface EventInfo {
  title?: string;
  date?: string;
  venue?: string;
  showSpeakers?: boolean;
  showSponsors?: boolean;
}

export interface GalleryImage {
  id: string;
  src: string | null;
  alt: string;
  caption?: string;
  category: "venue" | "speakers" | "behind";
  width: number;
  height: number;
  isPublished?: boolean;
}

export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Community" | "Supporter";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  tier: SponsorTier;
  websiteUrl?: string;
  isPublished?: boolean;
}
