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
} from "./mock-data";
import { Speaker, TeamMember, Activation, Sponsor } from "./types";

export async function getSpeakers(): Promise<Speaker[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(
      `*[_type == "speaker" && isPublished == true] | order(wave asc) {
        "id": _id,
        name,
        "imageUrl": photo.asset->url,
        shortDescriptor,
        talkTitle,
        themeConnection,
        bio,
        socialLinks,
        wave,
        isPublished
      }`
    );
  }
  return getMockSpeakers();
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(
      `*[_type == "teamMember"] {
        "id": _id,
        name,
        "imageUrl": photo.asset->url,
        role,
        department,
        quote,
        linkedinUrl
      }`
    );
  }
  return getMockTeamMembers();
}

export async function getActivations(): Promise<Activation[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(
      `*[_type == "activation"] | order(order asc) {
        "id": _id,
        name,
        "imageUrl": image.asset->url,
        description,
        locationInVenue,
        order
      }`
    );
  }
  return getMockActivations();
}

export async function getSponsors(): Promise<Sponsor[]> {
  if (isSanityConfigured && sanityClient) {
    return sanityClient.fetch(
      `*[_type == "sponsor"] {
        "id": _id,
        name,
        "logoUrl": logo.asset->url,
        tier,
        websiteUrl
      }`
    );
  }
  return getMockSponsors();
}
