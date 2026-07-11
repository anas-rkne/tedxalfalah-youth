/**
 * ============================================================================
 * MOCK DATA LAYER
 * ============================================================================
 * هذا الملف يحاكي بيانات ستأتي لاحقاً من Sanity CMS (راجع المرحلة 5 و6 من
 * خطة التنفيذ). كل دالة هنا بنفس التوقيع (signature) الذي ستحتاجه دالة
 * Sanity الحقيقية، لذلك عند ربط CMS الفعلي، فقط استبدل جسم الدالة بـ
 * client.fetch(...) دون تغيير أي مكان يستدعيها بالمشروع.
 *
 * لربط Sanity الحقيقي لاحقاً:
 * 1. أنشئ src/lib/sanity.ts بعميل Sanity (client) حسب المرحلة 5.9 بالخطة.
 * 2. استبدل جسم كل دالة أدناه باستعلام GROQ مطابق.
 * 3. لا حاجة لتعديل أي صفحة تستورد هذه الدوال.
 * ============================================================================
 */

import {
  Speaker,
  TeamMember,
  Activation,
  Sponsor,
  Session,
} from "./types";

const MOCK_SPEAKERS: Speaker[] = [
  {
    id: "sp-1",
    name: "Amna Al Suwaidi",
    imageUrl: "/mock/speaker-placeholder.svg",
    shortDescriptor: "Student Innovator",
    talkTitle: "Building Robots That Understand Empathy",
    themeConnection: "Proof that tomorrow's ideas start in today's classroom.",
    bio: "Amna is a 13-year-old robotics enthusiast from Sharjah who has spent the last two years building assistive robots for children with sensory needs. [PLACEHOLDER BIO — 100-150 words to be provided by client].",
    socialLinks: { instagram: "#", linkedin: "#" },
    wave: 1,
    isPublished: true,
  },
  {
    id: "sp-2",
    name: "Yusuf Al Marzooqi",
    imageUrl: "/mock/speaker-placeholder.svg",
    shortDescriptor: "Young Poet",
    talkTitle: "Words We Didn't Know We Needed",
    themeConnection: "Real stories, told in a voice adults forgot they had.",
    bio: "[PLACEHOLDER BIO — 100-150 words to be provided by client].",
    socialLinks: { x: "#" },
    wave: 1,
    isPublished: true,
  },
  {
    id: "sp-3",
    name: "Dr. Layla Haddad",
    imageUrl: "/mock/speaker-placeholder.svg",
    shortDescriptor: "Child Development Expert",
    talkTitle: "What Kids Are Trying to Tell Us",
    themeConnection: "The adult perspective that makes youth voices louder.",
    bio: "[PLACEHOLDER BIO — 100-150 words to be provided by client].",
    socialLinks: { linkedin: "#" },
    wave: 1,
    isPublished: true,
  },
  {
    id: "sp-4",
    name: "Faisal Al Nuaimi",
    imageUrl: "/mock/speaker-placeholder.svg",
    shortDescriptor: "Teen Entrepreneur",
    talkTitle: "I Started a Business With My Allowance",
    themeConnection: "Big ideas do not wait for a business degree.",
    bio: "[PLACEHOLDER BIO — 100-150 words to be provided by client].",
    socialLinks: { instagram: "#", x: "#" },
    wave: 2,
    isPublished: true,
  },
];

const MOCK_TEAM: TeamMember[] = [
  {
    id: "tm-1",
    name: "Sara Al Ketbi",
    imageUrl: "/mock/team-placeholder.svg",
    role: "Curation Lead",
    department: "Curation",
    quote: "Every story deserves a stage.",
  },
  {
    id: "tm-2",
    name: "Omar Al Falasi",
    imageUrl: "/mock/team-placeholder.svg",
    role: "Production Manager",
    department: "Production",
  },
  {
    id: "tm-3",
    name: "Noura Al Shamsi",
    imageUrl: "/mock/team-placeholder.svg",
    role: "Speaker Coach",
    department: "Speaker Coaching",
  },
  {
    id: "tm-4",
    name: "Khalid Al Zaabi",
    imageUrl: "/mock/team-placeholder.svg",
    role: "Marketing Lead",
    department: "Marketing",
  },
];

const MOCK_ACTIVATIONS: Activation[] = [
  {
    id: "act-1",
    name: "Idea Wall",
    imageUrl: "/mock/activation-placeholder.svg",
    description:
      "An interactive wall where attendees post their own bold questions and ideas for the future. [PLACEHOLDER description, 50-80 words].",
    locationInVenue: "Main Foyer",
    order: 1,
  },
  {
    id: "act-2",
    name: "Youth Workshop Corner",
    imageUrl: "/mock/activation-placeholder.svg",
    description:
      "Hands-on mini workshops led by young facilitators. [PLACEHOLDER description, 50-80 words].",
    locationInVenue: "East Hall",
    order: 2,
  },
  {
    id: "act-3",
    name: "Photo Moment",
    imageUrl: "/mock/activation-placeholder.svg",
    description:
      "A branded photo backdrop to capture the day. [PLACEHOLDER description, 50-80 words].",
    locationInVenue: "Entrance",
    order: 3,
  },
];

const MOCK_SPONSORS: Sponsor[] = [
  {
    id: "spn-1",
    name: "Placeholder Platinum Partner",
    logoUrl: "/mock/sponsor-placeholder.svg",
    tier: "Platinum",
    websiteUrl: "#",
  },
  {
    id: "spn-2",
    name: "Placeholder Gold Partner",
    logoUrl: "/mock/sponsor-placeholder.svg",
    tier: "Gold",
    websiteUrl: "#",
  },
];

const MOCK_SESSIONS: Session[] = [
  {
    id: "sess-1",
    title: "Doors Open & Registration",
    type: "registration",
    startTime: "08:30",
    endTime: "09:00",
    location: "Main Foyer",
  },
  {
    id: "sess-2",
    title: "Opening Remarks",
    type: "talk",
    startTime: "09:00",
    endTime: "09:15",
    location: "Main Stage",
  },
  {
    id: "sess-3",
    title: "Building Robots That Understand Empathy",
    type: "talk",
    startTime: "09:15",
    endTime: "09:35",
    speakerName: "Amna Al Suwaidi",
    speakerId: "sp-1",
    location: "Main Stage",
  },
  {
    id: "sess-4",
    title: "Words We Didn't Know We Needed",
    type: "talk",
    startTime: "09:35",
    endTime: "09:55",
    speakerName: "Yusuf Al Marzooqi",
    speakerId: "sp-2",
    location: "Main Stage",
  },
  {
    id: "sess-5",
    title: "Coffee Break & Idea Wall",
    type: "break",
    startTime: "09:55",
    endTime: "10:20",
    location: "Main Foyer",
    description: "Grab a coffee and post your own bold idea on the wall.",
  },
  {
    id: "sess-6",
    title: "What Kids Are Trying to Tell Us",
    type: "talk",
    startTime: "10:20",
    endTime: "10:40",
    speakerName: "Dr. Layla Haddad",
    speakerId: "sp-3",
    location: "Main Stage",
  },
  {
    id: "sess-7",
    title: "Youth Workshop Corner",
    type: "activation",
    startTime: "10:40",
    endTime: "11:30",
    location: "East Hall",
    description: "Hands-on mini workshops led by young facilitators.",
  },
  {
    id: "sess-8",
    title: "I Started a Business With My Allowance",
    type: "talk",
    startTime: "11:30",
    endTime: "11:50",
    speakerName: "Faisal Al Nuaimi",
    speakerId: "sp-4",
    location: "Main Stage",
  },
  {
    id: "sess-9",
    title: "Closing Remarks & Group Photo",
    type: "talk",
    startTime: "11:50",
    endTime: "12:15",
    location: "Main Stage",
  },
];

// ---- Public data-access functions (mirror future Sanity queries) ----

export async function getSpeakers(): Promise<Speaker[]> {
  return MOCK_SPEAKERS.filter((s) => s.isPublished).sort(
    (a, b) => a.wave - b.wave
  );
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return MOCK_TEAM;
}

export async function getActivations(): Promise<Activation[]> {
  return [...MOCK_ACTIVATIONS].sort((a, b) => a.order - b.order);
}

export async function getSponsors(): Promise<Sponsor[]> {
  return MOCK_SPONSORS;
}

export async function getSessions(): Promise<Session[]> {
  return [...MOCK_SESSIONS].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}
