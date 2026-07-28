/**
 * ============================================================================
 * DATA ACCESS LAYER — نقطة الدخول الوحيدة لكل بيانات Sanity بالمشروع
 * ============================================================================
 * كل صفحة/مكوّن بالمشروع يستورد من هذا الملف فقط، وليس من sanity.ts أو
 * mock-data.ts مباشرة.
 *
 * السلوك:
 * - إذا كانت متغيرات البيئة NEXT_PUBLIC_SANITY_PROJECT_ID موجودة (بملف .env.local
 *   أو بإعدادات Vercel) → تُستخدم بيانات Sanity الحقيقية عبر استعلامات GROQ.
 * - إذا لم تكن موجودة → يعمل الموقع تلقائياً ببيانات تجريبية (mock) بدون أي
 *   كسر أو صفحة بيضاء، وهذا يسمح بتطوير واختبار الموقع محلياً قبل ربط الـ CMS.
 *
 * بمجرد إضافة مفاتيح Sanity الحقيقية بملف .env.local (أو Vercel)، سيتحول
 * الموقع تلقائياً لعرض البيانات الحقيقية دون أي تعديل كود إضافي.
 * ============================================================================
 */

import { sanityClient, isSanityConfigured } from "./sanity";
import {
  getSpeakers as getMockSpeakers,
  getTeamMembers as getMockTeamMembers,
  getActivations as getMockActivations,
  getSponsors as getMockSponsors,
  getSessions as getMockSessions,
  getEventInfo as getMockEventInfo,
} from "./mock-data";
import { Speaker, TeamMember, Activation, Sponsor, Session, EventInfo } from "./types";

export async function getSpeakers(): Promise<Speaker[]> {
  if (isSanityConfigured && sanityClient) {
    try {
      const raw = await sanityClient.fetch<Record<string, unknown>[]>(
        `*[_type == "speaker" && (!defined(isPublished) || isPublished == true)] | order(wave asc) {
          "id": _id,
          name,
          "imageUrl": photo.asset->url + "?w=400&q=80",
          shortDescriptor,
          talkTitle,
          themeConnection,
          bio,
          socialLinks,
          wave,
          isPublished
        }`
      );
      return raw.map((s) => ({
        ...s,
        imageUrl: (s.imageUrl as string) && !(s.imageUrl as string).startsWith("null") ? (s.imageUrl as string) : null,
      })) as unknown as Speaker[];
    } catch (e) {
      console.warn("Sanity fetch failed for speakers, falling back to mock:", e);
    }
  }
  return getMockSpeakers();
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (isSanityConfigured && sanityClient) {
    try {
      const raw = await sanityClient.fetch<Record<string, unknown>[]>(
        `*[_type == "teamMember" && (!defined(isPublished) || isPublished == true)] | order(name asc) {
          "id": _id,
          name,
          "imageUrl": photo.asset->url + "?w=400&q=80",
          role,
          department,
          quote,
          linkedinUrl
        }`
      );
      return raw.map((m) => ({
        ...m,
        imageUrl: (m.imageUrl as string) && !(m.imageUrl as string).startsWith("null") ? (m.imageUrl as string) : null,
      })) as unknown as TeamMember[];
    } catch (e) {
      console.warn("Sanity fetch failed for team members, falling back to mock:", e);
    }
  }
  return getMockTeamMembers();
}

export async function getActivations(): Promise<Activation[]> {
  if (isSanityConfigured && sanityClient) {
    try {
      const raw = await sanityClient.fetch<Record<string, unknown>[]>(
        `*[_type == "activation" && (!defined(isPublished) || isPublished == true)] | order(order asc) {
          "id": _id,
          name,
          "imageUrl": image.asset->url + "?w=600&q=80",
          description,
          locationInVenue,
          order
        }`
      );
      return raw.map((a) => ({
        ...a,
        imageUrl: (a.imageUrl as string) && !(a.imageUrl as string).startsWith("null") ? (a.imageUrl as string) : null,
      })) as unknown as Activation[];
    } catch (e) {
      console.warn("Sanity fetch failed for activations, falling back to mock:", e);
    }
  }
  return getMockActivations();
}

export async function getSponsors(): Promise<Sponsor[]> {
  if (isSanityConfigured && sanityClient) {
    try {
      const raw = await sanityClient.fetch<Record<string, unknown>[]>(
        `*[_type == "sponsor" && (!defined(isPublished) || isPublished == true)] | order(name asc) {
          "id": _id,
          name,
          "logoUrl": logo.asset->url + "?w=200&q=80",
          tier,
          websiteUrl
        }`
      );
      return raw.map((s) => ({
        ...s,
        logoUrl: (s.logoUrl as string) && !(s.logoUrl as string).startsWith("null") ? (s.logoUrl as string) : null,
      })) as unknown as Sponsor[];
    } catch (e) {
      console.warn("Sanity fetch failed for sponsors, falling back to mock:", e);
    }
  }
  return getMockSponsors();
}

export async function getSessions(): Promise<Session[]> {
  if (isSanityConfigured && sanityClient) {
    try {
      return await sanityClient.fetch(
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
    } catch (e) {
      console.warn("Sanity fetch failed for sessions, falling back to mock:", e);
    }
  }
  return getMockSessions();
}

export async function getEventInfo(): Promise<EventInfo | null> {
  if (isSanityConfigured && sanityClient) {
    try {
      return await sanityClient.fetch(
        `*[_type == "eventInfo"][0] {
          title,
          date,
          venue
        }`
      );
    } catch (e) {
      console.warn("Sanity fetch failed for event info, falling back to mock:", e);
    }
  }
  return getMockEventInfo();
}
