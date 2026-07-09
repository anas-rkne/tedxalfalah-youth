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

export type SponsorTier = "Platinum" | "Gold" | "Silver" | "Community";

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: SponsorTier;
  websiteUrl?: string;
}
