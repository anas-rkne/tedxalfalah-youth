/**
 * ============================================================================
 * MOCK DATA LAYER — مع تحسين الصور الوهمية للعرض الفوري
 * ============================================================================
 * تم استبدال مسارات الصور المحلية بـ URLs خارجية لتعمل فوراً دون الحاجة
 * لإنشاء مجلد public/mock أو تنزيل صور.
 * ============================================================================
 */

import {
  Speaker,
  TeamMember,
  Activation,
  Sponsor,
  Session,
} from "./types";

// ----- 1. المتحدثين (Speakers) مع صور وهمية -----
const MOCK_SPEAKERS: Speaker[] = [
  {
    id: "sp-1",
    name: "Amna Al Suwaidi",
    imageUrl: "https://i.pravatar.cc/600?img=1", // صورة امرأة
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
    imageUrl: "https://i.pravatar.cc/600?img=11", // صورة رجل
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
    imageUrl: "https://i.pravatar.cc/600?img=5", // صورة امرأة
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
    imageUrl: "https://i.pravatar.cc/600?img=12", // صورة رجل
    shortDescriptor: "Teen Entrepreneur",
    talkTitle: "I Started a Business With My Allowance",
    themeConnection: "Big ideas do not wait for a business degree.",
    bio: "[PLACEHOLDER BIO — 100-150 words to be provided by client].",
    socialLinks: { instagram: "#", x: "#" },
    wave: 2,
    isPublished: true,
  },
];

// ----- 2. فريق العمل (Team) مع صور وهمية -----
const MOCK_TEAM: TeamMember[] = [
  {
    id: "tm-1",
    name: "Sara Al Ketbi",
    imageUrl: "https://i.pravatar.cc/600?img=33", // صورة امرأة
    role: "Curation Lead",
    department: "Curation",
    quote: "Every story deserves a stage.",
  },
  {
    id: "tm-2",
    name: "Omar Al Falasi",
    imageUrl: "https://i.pravatar.cc/600?img=68", // صورة رجل
    role: "Production Manager",
    department: "Production",
  },
  {
    id: "tm-3",
    name: "Noura Al Shamsi",
    imageUrl: "https://i.pravatar.cc/600?img=24", // صورة امرأة
    role: "Speaker Coach",
    department: "Speaker Coaching",
  },
  {
    id: "tm-4",
    name: "Khalid Al Zaabi",
    imageUrl: "https://i.pravatar.cc/600?img=74", // صورة رجل
    role: "Marketing Lead",
    department: "Marketing",
  },
];

// ----- 3. الفعاليات (Activations) مع صور وهمية -----
const MOCK_ACTIVATIONS: Activation[] = [
  {
    id: "act-1",
    name: "Idea Wall",
    imageUrl: "https://placehold.co/600x400/222/fff?text=Idea+Wall", // صورة وهمية
    description:
      "An interactive wall where attendees post their own bold questions and ideas for the future. [PLACEHOLDER description, 50-80 words].",
    locationInVenue: "Main Foyer",
    order: 1,
  },
  {
    id: "act-2",
    name: "Youth Workshop Corner",
    imageUrl: "https://placehold.co/600x400/222/fff?text=Youth+Workshop", 
    description:
      "Hands-on mini workshops led by young facilitators. [PLACEHOLDER description, 50-80 words].",
    locationInVenue: "East Hall",
    order: 2,
  },
  {
    id: "act-3",
    name: "Photo Moment",
    imageUrl: "https://placehold.co/600x400/222/fff?text=Photo+Moment",
    description:
      "A branded photo backdrop to capture the day. [PLACEHOLDER description, 50-80 words].",
    locationInVenue: "Entrance",
    order: 3,
  },
];

// ----- 4. الشركاء (Sponsors) مع شعارات وهمية -----
const MOCK_SPONSORS: Sponsor[] = [
  {
    id: "spn-1",
    name: "Platinum Partner",
    logoUrl: "https://placehold.co/200x100/222/fff?text=Platinum", // شعار وهمي
    tier: "Platinum",
    websiteUrl: "#",
  },
  {
    id: "spn-2",
    name: "Gold Partner",
    logoUrl: "https://placehold.co/200x100/222/fff?text=Gold",
    tier: "Gold",
    websiteUrl: "#",
  },
  {
    id: "spn-3",
    name: "Silver Partner",
    logoUrl: "https://placehold.co/200x100/222/fff?text=Silver",
    tier: "Silver",
    websiteUrl: "#",
  },
];

// ----- 5. الجلسات (Sessions) -----
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