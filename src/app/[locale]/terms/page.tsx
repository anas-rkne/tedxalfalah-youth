import { Metadata } from "next";
import SectionContainer from "@/components/ui/SectionContainer";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions and Privacy Policy for TEDxAlFalah Youth.",
};

/**
 * ============================================================================
 * ملاحظة مهمة جداً — يُرجى القراءة قبل النشر
 * ============================================================================
 * النص أدناه مسودة أولية شاملة ومعقولة الصياغة، مبنية على أفضل الممارسات
 * الشائعة لمواقع الفعاليات التي تجمع بيانات قُصَّر، لكنها **ليست استشارة
 * قانونية** ولم تُراجَع من محامٍ. قبل نشر الموقع فعلياً، يجب:
 *
 * 1. مراجعتها من محامٍ مرخّص بدولة الإمارات (خصوصاً فيما يخص قانون حماية
 *    البيانات الشخصية الإماراتي PDPL وأحكامه الخاصة ببيانات القُصَّر).
 * 2. ملء كل الحقول بين [قوسين معقوفين] بمعلومات العميل الحقيقية.
 * 3. تأكيد اسم الجهة المنظمة القانوني وعنوانها الرسمي بقسم Liability.
 * ============================================================================
 */

const SECTIONS = [
  {
    title: "1. Application Terms",
    content: [
      "By submitting an application to speak at TEDxAlFalah Youth, you confirm that all information provided is accurate and truthful to the best of your knowledge.",
      "Applications submitted under the Young Speaker track (ages 10–14) require the explicit consent of a parent or legal guardian, provided via the checkbox on the application form. The organizing team may contact the parent/guardian directly to verify this consent before proceeding.",
      "By submitting your talk idea, summary, and any accompanying video pitch, you grant TEDxAlFalah Youth a non-exclusive license to review, discuss internally, and — if selected — further develop this content with you for the purpose of the event. You retain ownership of your original ideas and content.",
      "All selection decisions made by the review committee are final. As explained on the Apply page, non-selection reflects limited available slots and is not a judgment on the value of your story.",
      "TEDxAlFalah Youth reserves the right to adjust the application timeline, including extending or closing the application window earlier than originally announced, and will communicate any such changes on this website.",
    ],
  },
  {
    title: "2. Ticketing Terms",
    content: [
      "[PLACEHOLDER: confirm final ticketing model — paid via Stripe or free registration — before finalizing this section.]",
      "Tickets are issued to the named purchaser and are non-transferable unless otherwise arranged with the organizing team in advance.",
      "Refund requests must be submitted by email to marhaba@tedxalfalahyouth.com no later than [PLACEHOLDER: number of days] before the event date. Refunds are not guaranteed after this period.",
      "TEDxAlFalah Youth reserves the right to refuse entry or revoke a ticket in cases of safety concerns, capacity limits, or violation of these terms.",
      "In the unlikely event the event is postponed or cancelled, ticket holders will be notified via the email provided at purchase/registration, and refund or credit options will be communicated at that time.",
    ],
  },
  {
    title: "3. Photography and Filming Consent",
    content: [
      "Photography, video, and audio recording will take place throughout TEDxAlFalah Youth for archival, promotional, and TED licensing compliance purposes.",
      "By attending the event or submitting a speaker application, you (or, for applicants under 18, your parent/guardian) consent to being photographed and/or recorded, and to the use of this media across TEDxAlFalah Youth's website, social media channels, and TED's global platforms under the terms of the TEDx license.",
      "If you do not wish to be photographed or filmed, please inform a member of the event team upon arrival so reasonable accommodations can be made where possible; however, blanket exclusion from all recorded areas (such as the main stage during talks) may not always be feasible.",
      "Speaker talks are recorded and may be published publicly (including on YouTube via the TEDx program) following the event, in line with standard TEDx licensing requirements.",
    ],
  },
  {
    title: "4. Privacy Policy",
    content: [
      "This section explains what personal data TEDxAlFalah Youth collects through this website, why we collect it, how it is stored, and the rights you have over it. We take particular care with data belonging to children (ages 10–14) submitted through the Young Speaker application track.",
      "**What we collect.** Depending on which form you use, we may collect: full name, age, email address, phone number, city, school name (Young Speaker track only), parent/guardian name and contact details (Young Speaker track only), organization and role (Expert track only), talk idea details, and any message you send us via the Contact or Partnership forms. For ticket purchases, payment is processed directly by Stripe — we do not receive or store your full card details.",
      "**Why we collect it.** We use this information solely to: evaluate speaker applications, communicate with applicants and their parents/guardians about the selection process, process ticket registrations and send event-day information, respond to inquiries, and coordinate with prospective partners/sponsors.",
      "**Children's data.** For applicants under 18, we collect parent/guardian contact details specifically so that consent can be verified and so that the organizing team communicates with the parent/guardian throughout the process, not only with the child. We do not use children's data for any purpose beyond event organization, and we do not share it with third parties for marketing purposes.",
      "**Where your data is stored.** Application and registration data is stored in Google Sheets, accessible only to members of the TEDxAlFalah Youth organizing and review team. Speaker, team, sponsor, and schedule content displayed publicly on this website is managed via Sanity, a third-party content management platform. Email communications are sent via Resend. Ticket payments, where applicable, are processed by Stripe. Each of these providers has its own privacy and security practices as independent data processors.",
      "**How long we keep it.** We retain application data for [PLACEHOLDER: retention period, e.g. 12 months] after the event for record-keeping and to plan future editions, after which it is deleted upon request or as part of routine data hygiene. You may request earlier deletion at any time (see 'Your rights' below).",
      "**Your rights.** You (or, for a minor's data, their parent/guardian) may request to access, correct, or delete the personal data we hold about you by emailing marhaba@tedxalfalahyouth.com. We will respond within a reasonable timeframe and in accordance with applicable UAE data protection law.",
      "**Security.** We restrict access to application data to authorized organizing team members only, and rely on the security practices of our third-party providers (Google, Sanity, Resend, Stripe) for data in transit and at rest.",
      "**Cookies.** This website does not use tracking or advertising cookies. [PLACEHOLDER: update this line if analytics tools such as Google Analytics are added later, and disclose accordingly.]",
      "**Contact.** Questions about this privacy policy or your data can be directed to marhaba@tedxalfalahyouth.com.",
    ],
  },
  {
    title: "5. TEDx Licensing Acknowledgement",
    content: [
      "TEDxAlFalah Youth is organized independently and operated under a free license granted by TED, in accordance with the TEDx program's mission of discovering and spreading great ideas within local communities.",
      "This event is not officially affiliated with, sponsored by, or organized by TED or TEDx staff beyond the terms of the standard TEDx license. All content, speaker selection, and event operations are the sole responsibility of the independent TEDxAlFalah Youth organizing team.",
      "Speaker talks may be submitted to TED for potential inclusion on the official TEDx YouTube channel, in accordance with standard TEDx content guidelines, at the discretion of the TEDx program.",
    ],
  },
  {
    title: "6. Liability and General Conditions",
    content: [
      "TEDxAlFalah Youth, its organizers, and volunteers make reasonable efforts to ensure a safe and well-run event but do not accept liability for personal injury, loss, or damage to property during the event, except where required by applicable law.",
      "Attendees and applicants participate at their own risk. Parents/guardians of Young Speaker applicants remain responsible for their child's welfare while under their own supervision before and after any scheduled coaching, rehearsal, or event-day sessions, unless otherwise explicitly arranged with the organizing team.",
      "These terms are governed by the laws of the United Arab Emirates. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts of [PLACEHOLDER: Emirate, e.g. Dubai / Sharjah].",
      "TEDxAlFalah Youth reserves the right to update these Terms and Conditions and Privacy Policy from time to time. The most current version will always be available on this page, with the effective date noted below.",
      "[PLACEHOLDER: legal entity name and registered address of the organizing body, if applicable.]",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="py-16 md:py-24">
      <SectionContainer className="max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">
          Terms and Conditions &amp; Privacy Policy
        </h1>
        <p className="text-sm text-tedx-gray mb-10">
          Last updated: [PLACEHOLDER: date] · Effective for TEDxAlFalah Youth
        </p>

        <div className="flex flex-col gap-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold mb-3">{section.title}</h2>
              <div className="flex flex-col gap-3">
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-tedx-gray leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
}
