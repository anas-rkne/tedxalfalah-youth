const BASE_URL = "https://www.tedxalfalahyouth.com";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TEDxAlFalah Youth",
    url: BASE_URL,
    logo: `${BASE_URL}/my-favicon/favicon-96x96.png`,
    description:
      "An independently organized TEDx event showcasing young voices and real ideas.",
    sameAs: [
      "https://www.instagram.com/tedxalfalahyouth",
      "https://www.linkedin.com/company/tedxalfalahyouth",
      "https://x.com/tedxalfalahyouth",
    ],
  };
}

export function eventSchema(eventInfo: {
  title?: string;
  date?: string;
  venue?: string;
  description?: string;
  performers?: { name: string; url?: string }[];
}) {
  const name = eventInfo.title || "TEDxAlFalah Youth";
  const startDate = eventInfo.date || "2026-11-15";
  const location = eventInfo.venue || "Dubai, United Arab Emirates";

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
    endDate: startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: location,
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
        addressCountry: "AE",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "TEDxAlFalah Youth",
      url: BASE_URL,
    },
  };

  if (eventInfo.description) {
    schema.description = eventInfo.description;
  }

  if (eventInfo.performers?.length) {
    schema.performer = eventInfo.performers.map((p) => ({
      "@type": "Person",
      name: p.name,
      ...(p.url && { url: p.url }),
    }));
  }

  return schema;
}

export function personSchema(person: {
  name: string;
  description?: string;
  image?: string;
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
  };

  if (person.description) schema.description = person.description;
  if (person.image) schema.image = person.image;

  return schema;
}
