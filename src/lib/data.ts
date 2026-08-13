import { sanityClient, isSanityConfigured, urlFor } from "./sanity";
import { Speaker, TeamMember, Activation, Sponsor, Session, EventInfo, GalleryImage } from "./types";

async function fetchSanity<T>(groq: string): Promise<T | null> {
  if (!isSanityConfigured || !sanityClient) return null;
  try {
    return await sanityClient.fetch<T>(groq);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Sanity] Fetch failed:", error);
    }
    return null;
  }
}

export async function getSpeakers(): Promise<Speaker[]> {
  type Raw = {
    id: string;
    name: string;
    photo: { _ref: string } | null;
    shortDescriptor: string | null;
    talkTitle: string | null;
    themeConnection: string | null;
    bio: string | null;
    socialLinks: { instagram?: string; linkedin?: string; x?: string } | null;
    wave: number;
    order: number | null;
    isPublished: boolean;
  };

  const raw = await fetchSanity<Raw[]>(
    `*[_type == "speaker" && (!defined(isPublished) || isPublished == true)] | order(wave asc, order asc, name asc) {
      "id": _id,
      name,
      photo,
      shortDescriptor,
      talkTitle,
      themeConnection,
      bio,
      socialLinks,
      wave,
      order,
      isPublished
    }`
  );
  if (!raw) return [];

  return raw.map((s) => ({
    id: s.id,
    name: s.name,
    imageUrl: s.photo ? urlFor(s.photo)?.width(400).quality(80).url() ?? null : null,
    shortDescriptor: s.shortDescriptor ?? "",
    talkTitle: s.talkTitle ?? "",
    themeConnection: s.themeConnection ?? "",
    bio: s.bio ?? "",
    socialLinks: s.socialLinks ?? {},
    wave: s.wave,
    order: s.order ?? 0,
    isPublished: s.isPublished,
  }));
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  type Raw = {
    id: string;
    name: string;
    photo: { _ref: string } | null;
    role: string;
    department: TeamMember["department"];
    quote: string | null;
    linkedinUrl: string | null;
    isPublished: boolean;
  };

  const raw = await fetchSanity<Raw[]>(
    `*[_type == "teamMember" && (!defined(isPublished) || isPublished == true)] | order(name asc) {
      "id": _id,
      name,
      photo,
      role,
      department,
      quote,
      linkedinUrl,
      isPublished
    }`
  );
  if (!raw) return [];

  return raw.map((m) => ({
    id: m.id,
    name: m.name,
    imageUrl: m.photo ? urlFor(m.photo)?.width(400).quality(80).url() ?? null : null,
    role: m.role,
    department: m.department,
    quote: m.quote ?? undefined,
    linkedinUrl: m.linkedinUrl ?? undefined,
  }));
}

export async function getActivations(): Promise<Activation[]> {
  type Raw = {
    id: string;
    name: string;
    image: { _ref: string } | null;
    description: string;
    locationInVenue: string | null;
    order: number;
    isPublished: boolean;
  };

  const raw = await fetchSanity<Raw[]>(
    `*[_type == "activation" && (!defined(isPublished) || isPublished == true)] | order(order asc) {
      "id": _id,
      name,
      image,
      description,
      locationInVenue,
      order,
      isPublished
    }`
  );
  if (!raw) return [];

  return raw.map((a) => ({
    id: a.id,
    name: a.name,
    imageUrl: a.image ? urlFor(a.image)?.width(600).quality(80).url() ?? null : null,
    description: a.description,
    locationInVenue: a.locationInVenue ?? "",
    order: a.order,
  }));
}

export async function getSponsors(): Promise<Sponsor[]> {
  type Raw = {
    id: string;
    name: string;
    logo: { _ref: string } | null;
    tier: Sponsor["tier"];
    websiteUrl: string | null;
    isPublished: boolean;
  };

  const raw = await fetchSanity<Raw[]>(
    `*[_type == "sponsor" && (!defined(isPublished) || isPublished == true)] | order(name asc) {
      "id": _id,
      name,
      logo,
      tier,
      websiteUrl,
      isPublished
    }`
  );
  if (!raw) return [];

  return raw.map((s) => ({
    id: s.id,
    name: s.name,
    logoUrl: s.logo ? urlFor(s.logo)?.width(200).quality(80).url() ?? null : null,
    tier: s.tier,
    websiteUrl: s.websiteUrl ?? undefined,
  }));
}

export async function getSessions(): Promise<Session[]> {
  const data = await fetchSanity<Session[]>(
    `*[_type == "session" && (!defined(isPublished) || isPublished == true)] | order(startTime asc) {
      "id": _id,
      title,
      type,
      startTime,
      endTime,
      "speakerName": speaker->name,
      "speakerId": speaker->_id,
      location,
      description
    }`
  );
  return data ?? [];
}

export async function getEventInfo(): Promise<EventInfo | null> {
  return fetchSanity<EventInfo>(
    `*[_type == "eventInfo"][0] {
      title,
      date,
      venue,
      showSpeakers,
      showSponsors,
      showTeam
    }`
  );
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  type Raw = {
    id: string;
    image: { _ref: string } | null;
    alt: string | null;
    caption: string | null;
    category: GalleryImage["category"];
    width: number;
    height: number;
    isPublished: boolean;
  };

  const raw = await fetchSanity<Raw[]>(
    `*[_type == "galleryImage" && (!defined(isPublished) || isPublished == true)] | order(order asc) {
      "id": _id,
      image,
      alt,
      caption,
      category,
      "width": image.asset->metadata.dimensions.width,
      "height": image.asset->metadata.dimensions.height
    }`
  );
  if (!raw) return [];

  return raw.map((g) => ({
    id: g.id,
    src: g.image ? urlFor(g.image)?.width(1200).quality(80).url() ?? null : null,
    alt: g.alt ?? "",
    caption: g.caption ?? undefined,
    category: g.category,
    width: g.width,
    height: g.height,
  }));
}
