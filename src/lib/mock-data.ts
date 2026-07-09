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
